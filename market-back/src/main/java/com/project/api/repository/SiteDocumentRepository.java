package com.project.api.repository;

import com.project.api.domain.SiteDocument;
import com.project.api.domain.SiteDocumentType;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SiteDocumentRepository extends JpaRepository<SiteDocument, Long> {

    Optional<SiteDocument> findByDocumentType(SiteDocumentType documentType);

    boolean existsByDocumentType(SiteDocumentType documentType);
}
