package com.project.api.web;

import com.project.api.domain.SiteDocumentType;
import com.project.api.service.SiteDocumentService;
import com.project.api.web.dto.SiteDocumentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/content")
@RequiredArgsConstructor
public class ContentController {

    private final SiteDocumentService siteDocumentService;

    @GetMapping("/terms")
    public SiteDocumentResponse terms() {
        return siteDocumentService.get(SiteDocumentType.TERMS);
    }

    @GetMapping("/privacy")
    public SiteDocumentResponse privacy() {
        return siteDocumentService.get(SiteDocumentType.PRIVACY);
    }
}
