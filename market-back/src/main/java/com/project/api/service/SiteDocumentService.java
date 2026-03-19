package com.project.api.service;

import com.project.api.domain.SiteDocument;
import com.project.api.domain.SiteDocumentType;
import com.project.api.repository.SiteDocumentRepository;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.SiteDocumentResponse;
import com.project.api.web.dto.SiteDocumentUpdateRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiteDocumentService {

    private final SiteDocumentRepository siteDocumentRepository;

    public SiteDocumentResponse get(SiteDocumentType type) {
        SiteDocument d = siteDocumentRepository.findByDocumentType(type)
                .orElseThrow(() -> new NotFoundException("Document not found: " + type));
        return SiteDocumentResponse.from(d);
    }

    public Map<String, SiteDocumentResponse> getAllForAdmin() {
        Map<String, SiteDocumentResponse> map = new LinkedHashMap<>();
        for (SiteDocumentType t : SiteDocumentType.values()) {
            siteDocumentRepository.findByDocumentType(t)
                    .ifPresent(d -> map.put(t.name(), SiteDocumentResponse.from(d)));
        }
        return map;
    }

    @Transactional
    public SiteDocumentResponse update(SiteDocumentType type, SiteDocumentUpdateRequest request) {
        SiteDocument d = siteDocumentRepository.findByDocumentType(type)
                .orElseThrow(() -> new NotFoundException("Document not found: " + type));
        d.setContent(request.getContent());
        return SiteDocumentResponse.from(d);
    }
}
