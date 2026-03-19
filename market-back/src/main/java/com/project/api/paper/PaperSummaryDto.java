package com.project.api.paper;

import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value
@Builder
public class PaperSummaryDto {
    String id;
    String title;
    Integer year;
    long citedByCount;
    String doi;
    String abstractText;
    List<String> authors;
}
