package com.project.api.paper;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/papers")
@RequiredArgsConstructor
public class PaperController {

    private final OpenAlexPaperService paperService;

    @GetMapping("/search")
    public PaperSearchResponse search(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        try {
            return paperService.search(q, page, size);
        } catch (IllegalStateException e) {
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "OpenAlex unavailable", e);
        }
    }

    /** Citation-style graph: seed → references; citing works → seed. */
    @GetMapping("/graph/{workId}")
    public PaperGraphResponse graph(@PathVariable String workId) {
        return paperService.graph(workId);
    }
}
