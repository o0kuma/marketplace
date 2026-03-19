package com.project.api.web.dto;

import com.project.api.domain.SiteDocument;
import com.project.api.domain.SiteDocumentType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SiteDocumentResponse {

    private SiteDocumentType type;
    private String content;
    private LocalDateTime updatedAt;

    public static SiteDocumentResponse from(SiteDocument d) {
        return SiteDocumentResponse.builder()
                .type(d.getDocumentType())
                .content(d.getContent())
                .updatedAt(d.getUpdatedAt())
                .build();
    }
}
