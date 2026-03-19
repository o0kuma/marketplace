package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "site_documents")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SiteDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true, length = 20)
    private SiteDocumentType documentType;

    @Lob
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @Builder
    public SiteDocument(SiteDocumentType documentType, String content) {
        this.documentType = documentType;
        this.content = content;
        this.updatedAt = LocalDateTime.now();
    }

    public void setContent(String content) {
        this.content = content;
        this.updatedAt = LocalDateTime.now();
    }
}
