package com.project.api.paper;

import com.fasterxml.jackson.databind.JsonNode;
import com.project.api.web.NotFoundException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.net.URI;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
@Slf4j
@Service
public class OpenAlexPaperService {

    private static final Pattern WORK_ID = Pattern.compile("^W\\d+$");
    private static final String SELECT_WORK =
            "id,title,publication_year,cited_by_count,doi,abstract_inverted_index,authorships,referenced_works";

    private final OpenAlexProperties props;
    private final ObjectMapper objectMapper;
    private final RestTemplate openAlexRestTemplate;

    public OpenAlexPaperService(
            OpenAlexProperties props,
            ObjectMapper objectMapper,
            @Qualifier("openAlexRestTemplate") RestTemplate openAlexRestTemplate) {
        this.props = props;
        this.objectMapper = objectMapper;
        this.openAlexRestTemplate = openAlexRestTemplate;
    }

    public PaperSearchResponse search(String q, int page, int size) {
        if (q == null || q.isBlank()) {
            return PaperSearchResponse.builder()
                    .results(List.of())
                    .totalCount(0)
                    .page(page)
                    .size(size)
                    .build();
        }
        size = Math.min(Math.max(size, 1), 50);
        page = Math.max(page, 0);
        int oaPage = page + 1;

        URI uri = UriComponentsBuilder.fromHttpUrl(props.getBaseUrl() + "/works")
                .queryParam("search", q.trim())
                .queryParam("page", oaPage)
                .queryParam("per-page", size)
                .queryParam("select", "id,title,publication_year,cited_by_count,doi,abstract_inverted_index,authorships")
                .encode(StandardCharsets.UTF_8)
                .build()
                .toUri();

        try {
            ResponseEntity<String> res = openAlexRestTemplate.exchange(
                    uri, HttpMethod.GET, entityWithUa(), String.class);
            JsonNode root = objectMapper.readTree(res.getBody());
            long total = root.path("meta").path("count").asLong(0);
            List<PaperSummaryDto> results = new ArrayList<>();
            for (JsonNode w : root.path("results")) {
                results.add(workToSummary(w));
            }
            return PaperSearchResponse.builder()
                    .results(results)
                    .totalCount(total)
                    .page(page)
                    .size(size)
                    .build();
        } catch (Exception e) {
            log.warn("OpenAlex search failed: {}", e.getMessage());
            throw new IllegalStateException("Paper search temporarily unavailable", e);
        }
    }

    public PaperGraphResponse graph(String workIdRaw) {
        String workId = normalizeWorkId(workIdRaw);
        if (!WORK_ID.matcher(workId).matches()) {
            throw new IllegalArgumentException("Invalid OpenAlex work id (expected W…)");
        }

        JsonNode seed = fetchWorkJson(workId);
        if (seed == null || seed.isMissingNode() || seed.path("id").asText().isEmpty()) {
            throw new NotFoundException("Work not found: " + workId);
        }

        List<String> refIds = new ArrayList<>();
        for (JsonNode refUrl : seed.path("referenced_works")) {
            if (refIds.size() >= props.getGraphRefsLimit()) break;
            String sid = shortIdFromUrl(refUrl.asText());
            if (sid != null && !sid.equals(workId)) refIds.add(sid);
        }

        ExecutorService pool = Executors.newFixedThreadPool(8);
        try {
            Map<String, JsonNode> refWorks = fetchWorksParallel(refIds, pool);
            List<JsonNode> citers = fetchCitingWorks(workId);

            Map<String, PaperGraphResponse.GraphNode> nodes = new LinkedHashMap<>();
            addNode(nodes, seed, true);

            for (String rid : refIds) {
                JsonNode w = refWorks.get(rid);
                if (w != null) addNode(nodes, w, false);
            }
            for (JsonNode c : citers) {
                addNode(nodes, c, false);
            }

            List<PaperGraphResponse.GraphLink> links = new ArrayList<>();
            for (String rid : refIds) {
                if (nodes.containsKey(rid)) {
                    links.add(PaperGraphResponse.GraphLink.builder().source(workId).target(rid).build());
                }
            }
            for (JsonNode c : citers) {
                String cid = shortIdFromUrl(c.path("id").asText());
                if (cid != null && nodes.containsKey(cid)) {
                    links.add(PaperGraphResponse.GraphLink.builder().source(cid).target(workId).build());
                }
            }

            return PaperGraphResponse.builder()
                    .nodes(new ArrayList<>(nodes.values()))
                    .links(links)
                    .build();
        } finally {
            pool.shutdown();
        }
    }

    private void addNode(Map<String, PaperGraphResponse.GraphNode> nodes, JsonNode w, boolean seed) {
        String id = shortIdFromUrl(w.path("id").asText());
        if (id == null) return;
        nodes.put(id, PaperGraphResponse.GraphNode.builder()
                .id(id)
                .title(w.path("title").asText(""))
                .year(w.path("publication_year").isNull() ? null : w.path("publication_year").asInt())
                .citations(w.path("cited_by_count").asLong(0))
                .doi(extractDoi(w.path("doi").asText(null)))
                .seed(seed)
                .firstAuthor(firstAuthorShort(w))
                .build());
    }

    private List<JsonNode> fetchCitingWorks(String workId) {
        URI uri = UriComponentsBuilder.fromHttpUrl(props.getBaseUrl() + "/works")
                .queryParam("filter", "cites:" + workId)
                .queryParam("per-page", props.getGraphCitesLimit())
                .queryParam("select", "id,title,publication_year,cited_by_count,doi,authorships")
                .build()
                .toUri();
        try {
            ResponseEntity<String> res = openAlexRestTemplate.exchange(
                    uri, HttpMethod.GET, entityWithUa(), String.class);
            JsonNode root = objectMapper.readTree(res.getBody());
            List<JsonNode> out = new ArrayList<>();
            for (JsonNode w : root.path("results")) {
                out.add(w);
            }
            return out;
        } catch (Exception e) {
            log.warn("OpenAlex cites filter failed for {}: {}", workId, e.getMessage());
            return List.of();
        }
    }

    private Map<String, JsonNode> fetchWorksParallel(List<String> ids, ExecutorService pool) {
        if (ids.isEmpty()) return Map.of();
        List<Future<JsonNode>> futures = new ArrayList<>();
        for (String id : ids) {
            futures.add(pool.submit(() -> fetchWorkJson(id)));
        }
        Map<String, JsonNode> map = new HashMap<>();
        for (int i = 0; i < futures.size(); i++) {
            try {
                JsonNode w = futures.get(i).get(props.getGraphTimeoutMs(), TimeUnit.MILLISECONDS);
                if (w != null && !w.isMissingNode()) {
                    String sid = shortIdFromUrl(w.path("id").asText());
                    if (sid != null) map.put(sid, w);
                }
            } catch (Exception e) {
                log.debug("Skip ref work {}: {}", ids.get(i), e.getMessage());
            }
        }
        return map;
    }

    private JsonNode fetchWorkJson(String workId) {
        URI uri = URI.create(props.getBaseUrl() + "/works/" + workId + "?select=" + SELECT_WORK);
        try {
            ResponseEntity<String> res = openAlexRestTemplate.exchange(
                    uri, HttpMethod.GET, entityWithUa(), String.class);
            return objectMapper.readTree(res.getBody());
        } catch (RestClientException e) {
            log.debug("OpenAlex work {}: {}", workId, e.getMessage());
            return null;
        } catch (Exception e) {
            return null;
        }
    }

    private HttpEntity<Void> entityWithUa() {
        HttpHeaders h = new HttpHeaders();
        String mail = props.getContactEmail() != null && !props.getContactEmail().isBlank()
                ? props.getContactEmail().trim()
                : "mailto:dev@localhost";
        h.add("User-Agent", "MarketplacePaperSearch/1.0 (" + mail + ")");
        h.add("Accept", "application/json");
        return new HttpEntity<>(h);
    }

    private PaperSummaryDto workToSummary(JsonNode w) {
        String id = shortIdFromUrl(w.path("id").asText());
        List<String> authors = new ArrayList<>();
        for (JsonNode au : w.path("authorships")) {
            String name = au.path("author").path("display_name").asText();
            if (!name.isEmpty()) {
                authors.add(name);
                if (authors.size() >= 8) break;
            }
        }
        String abs = abstractFromInverted(w.path("abstract_inverted_index"));
        return PaperSummaryDto.builder()
                .id(id != null ? id : "")
                .title(w.path("title").asText(""))
                .year(w.path("publication_year").isNull() ? null : w.path("publication_year").asInt())
                .citedByCount(w.path("cited_by_count").asLong(0))
                .doi(extractDoi(w.path("doi").asText(null)))
                .abstractText(abs)
                .authors(authors)
                .build();
    }

    static String abstractFromInverted(JsonNode inv) {
        if (inv == null || !inv.isObject()) return "";
        Map<Integer, String> map = new TreeMap<>();
        Iterator<Map.Entry<String, JsonNode>> it = inv.fields();
        while (it.hasNext()) {
            Map.Entry<String, JsonNode> e = it.next();
            String word = e.getKey();
            for (JsonNode pos : e.getValue()) {
                if (pos.isIntegralNumber()) {
                    map.put(pos.asInt(), word);
                }
            }
        }
        return map.values().stream().collect(Collectors.joining(" "));
    }

    static String firstAuthorShort(JsonNode w) {
        JsonNode a0 = w.path("authorships").path(0);
        if (a0.isMissingNode() || !a0.path("author").path("display_name").isTextual()) {
            return null;
        }
        String name = a0.path("author").path("display_name").asText("").trim();
        if (name.isEmpty()) return null;
        if (name.contains(",")) {
            return name.split(",")[0].trim();
        }
        String[] parts = name.split("\\s+");
        return parts[parts.length - 1];
    }

    static String shortIdFromUrl(String url) {
        if (url == null || url.isEmpty()) return null;
        int i = url.lastIndexOf("/W");
        if (i < 0) return null;
        String tail = url.substring(i + 1);
        return WORK_ID.matcher(tail).matches() ? tail : null;
    }

    static String normalizeWorkId(String raw) {
        if (raw == null) return "";
        String t = raw.trim();
        if (t.contains("openalex.org/")) {
            String s = shortIdFromUrl(t);
            return s != null ? s : t;
        }
        return t.startsWith("W") ? t : "W" + t.replaceFirst("^W", "");
    }

    static String extractDoi(String doiUrl) {
        if (doiUrl == null || doiUrl.isEmpty()) return null;
        if (doiUrl.startsWith("https://doi.org/")) return doiUrl.substring("https://doi.org/".length());
        if (doiUrl.startsWith("http://doi.org/")) return doiUrl.substring("http://doi.org/".length());
        return doiUrl;
    }
}
