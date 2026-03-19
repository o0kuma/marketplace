package com.project.api.paper;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class PaperGraphResponse {
    List<GraphNode> nodes;
    List<GraphLink> links;

    @Value
    @Builder
    public static class GraphNode {
        String id;
        String title;
        Integer year;
        long citations;
        String doi;
        boolean seed;
        /** First author family name (short label for graph). */
        String firstAuthor;
    }

    @Value
    @Builder
    public static class GraphLink {
        String source;
        String target;
    }
}
