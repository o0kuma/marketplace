package com.project.api.config;

import com.project.api.domain.SiteDocument;
import com.project.api.domain.SiteDocumentType;
import com.project.api.repository.SiteDocumentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Seeds default terms & privacy HTML when missing (first startup).
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class InitialSiteDocumentsRunner implements CommandLineRunner {

    private static final String DEFAULT_TERMS = """
            <p class="lead">오픈마켓 서비스 이용약관입니다. 관리자에서 수정할 수 있습니다.</p>
            <ul>
            <li><strong>제1조 (목적)</strong> 본 약관은 오픈마켓이 제공하는 서비스의 이용 조건 및 절차를 규정합니다.</li>
            <li><strong>제2조 (정의)</strong> 서비스, 회원, 판매자 등 필요한 용어를 정의합니다.</li>
            <li><strong>제3조 (약관의 효력)</strong> 약관은 회원가입 시 동의한 시점부터 적용됩니다.</li>
            <li><strong>제4조 (서비스의 제공)</strong> 오픈마켓은 전자상거래 플랫폼 서비스를 제공합니다.</li>
            <li><strong>제5조 (회원의 의무)</strong> 회원은 타인의 정보를 도용하거나 서비스를 부정 이용하여서는 안 됩니다.</li>
            </ul>
            """;

    private static final String DEFAULT_PRIVACY = """
            <p class="lead">개인정보처리방침입니다. 관리자에서 수정할 수 있습니다.</p>
            <ul>
            <li><strong>1. 수집 항목</strong> 이름, 이메일, 전화번호, 주소 등 서비스 이용에 필요한 정보</li>
            <li><strong>2. 이용 목적</strong> 서비스 제공, 주문·배송, 고객 상담</li>
            <li><strong>3. 보유 및 파기</strong> 탈퇴 시 지체 없이 파기 (법령에 따른 보존 예외)</li>
            <li><strong>4. 제3자 제공</strong> 원칙적으로 제공하지 않으며, 법령에 따른 경우 예외</li>
            <li><strong>5. 이용자 권리</strong> 열람, 정정, 삭제, 처리 정지 요청 가능</li>
            </ul>
            """;

    private final SiteDocumentRepository siteDocumentRepository;

    @Override
    public void run(String... args) {
        if (!siteDocumentRepository.existsByDocumentType(SiteDocumentType.TERMS)) {
            siteDocumentRepository.save(SiteDocument.builder()
                    .documentType(SiteDocumentType.TERMS)
                    .content(DEFAULT_TERMS)
                    .build());
            log.info("Seeded default TERMS document");
        }
        if (!siteDocumentRepository.existsByDocumentType(SiteDocumentType.PRIVACY)) {
            siteDocumentRepository.save(SiteDocument.builder()
                    .documentType(SiteDocumentType.PRIVACY)
                    .content(DEFAULT_PRIVACY)
                    .build());
            log.info("Seeded default PRIVACY document");
        }
    }
}
