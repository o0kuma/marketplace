package com.project.api.paper;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class PaperSearchResponse {
    List<PaperSummaryDto> results;
    long totalCount;
    int page;
    int size;
}
