package com.project.api.web;

import com.project.api.domain.SiteDocumentType;
import com.project.api.service.SiteDocumentService;
import com.project.api.web.dto.SiteDocumentResponse;
import com.project.api.web.dto.SiteDocumentUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/site-documents")
@RequiredArgsConstructor
public class AdminSiteDocumentController {

    private final SiteDocumentService siteDocumentService;

    @GetMapping
    public Map<String, SiteDocumentResponse> list() {
        return siteDocumentService.getAllForAdmin();
    }

    @PutMapping("/{type}")
    public SiteDocumentResponse update(
            @PathVariable String type,
            @Valid @RequestBody SiteDocumentUpdateRequest request) {
        SiteDocumentType t = SiteDocumentType.valueOf(type.toUpperCase());
        return siteDocumentService.update(t, request);
    }
}
