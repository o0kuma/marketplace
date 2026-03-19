package com.project.api.config;

import com.project.api.domain.Member;
import com.project.api.domain.MemberRole;
import com.project.api.repository.MemberRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * Creates a single super admin account on first startup when no ADMIN user exists.
 * Credentials are read from app.admin.email and app.admin.password (change after first login).
 */
@Slf4j
@Component
@Order(1)
@RequiredArgsConstructor
public class InitialAdminRunner implements CommandLineRunner {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.admin.email:admin@example.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin1234}")
    private String adminPassword;

    @Override
    public void run(String... args) {
        if (memberRepository.existsByRole(MemberRole.ADMIN)) {
            return;
        }
        if (memberRepository.existsByEmail(adminEmail)) {
            log.warn("Initial admin email {} already exists but is not ADMIN. Skipping admin seed.", adminEmail);
            return;
        }
        String encodedPassword = passwordEncoder.encode(adminPassword);
        Member admin = Member.builder()
                .name("관리자")
                .email(adminEmail)
                .password(encodedPassword)
                .role(MemberRole.ADMIN)
                .termsAgreedAt(LocalDateTime.now())
                .build();
        memberRepository.save(admin);
        log.info("Initial super admin created: {} (change password after first login)", adminEmail);
    }
}
