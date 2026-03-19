package com.project.api.service;

import com.project.api.domain.Member;
import com.project.api.domain.MemberRole;
import com.project.api.repository.MemberRepository;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.MemberRequest;
import com.project.api.web.dto.MemberResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Member signup and lookup. Duplicate email results in exception.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MemberService {

    private static final int PASSWORD_RESET_EXPIRY_HOURS = 1;

    private final MemberRepository memberRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    @Transactional
    public MemberResponse signup(MemberRequest request) {
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered: " + request.getEmail());
        }
        String encodedPassword = passwordEncoder.encode(request.getPassword());
        var termsAt = request.getTermsAgreedAt() != null ? request.getTermsAgreedAt() : java.time.LocalDateTime.now();
        Member member = Member.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(encodedPassword)
                .phone(request.getPhone())
                .address(request.getAddress())
                .role(request.getRole() != null ? request.getRole() : MemberRole.USER)
                .termsAgreedAt(termsAt)
                .build();
        member = memberRepository.save(member);
        return MemberResponse.from(member);
    }

    @Transactional
    public MemberResponse updateProfile(Long memberId, com.project.api.web.dto.MemberUpdateRequest request) {
        Member member = findById(memberId);
        member.updateProfile(request.getName(), request.getPhone(), request.getAddress());
        if (request.getProfileImageUrl() != null) {
            member.setProfileImageUrl(request.getProfileImageUrl());
        }
        return MemberResponse.from(member);
    }

    @Transactional
    public void changePassword(Long memberId, String currentPassword, String newPassword) {
        Member member = findById(memberId);
        if (!passwordEncoder.matches(currentPassword, member.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect");
        }
        member.setPassword(passwordEncoder.encode(newPassword));
    }

    @Transactional
    public void withdraw(Long memberId) {
        Member member = findById(memberId);
        member.markDeleted();
    }

    public Member findById(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Member not found: " + id));
        if (member.isDeleted()) {
            throw new NotFoundException("Member not found: " + id);
        }
        return member;
    }

    public Member findByEmail(String email) {
        return memberRepository.findByEmail(email)
                .orElseThrow(() -> new NotFoundException("Member not found: " + email));
    }

    /**
     * Request password reset: if email exists, set token and send reset link.
     * Always returns without error to avoid email enumeration.
     */
    @Transactional
    public void requestPasswordReset(String email) {
        if (email == null || email.isBlank()) return;
        Optional<Member> opt = memberRepository.findByEmail(email.trim());
        if (opt.isEmpty()) return;
        Member member = opt.get();
        if (member.isDeleted()) return;
        String token = UUID.randomUUID().toString().replace("-", "");
        member.setPasswordResetToken(token, LocalDateTime.now().plusHours(PASSWORD_RESET_EXPIRY_HOURS));
        emailService.sendPasswordResetEmail(member.getEmail(), member.getName(), token);
    }

    /**
     * Reset password with token from email link. Throws if token invalid or expired.
     */
    @Transactional
    public void resetPassword(String token, String newPassword) {
        if (token == null || token.isBlank()) {
            throw new IllegalArgumentException("Invalid or expired reset link");
        }
        Member member = memberRepository.findByPasswordResetToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link"));
        if (!member.isPasswordResetTokenValid(token)) {
            throw new IllegalArgumentException("Invalid or expired reset link");
        }
        if (newPassword == null || newPassword.length() < 4) {
            throw new IllegalArgumentException("Password must be at least 4 characters");
        }
        member.setPassword(passwordEncoder.encode(newPassword));
        member.clearPasswordResetToken();
    }

    /** Admin: list members with optional keyword, include deleted. */
    public Page<MemberResponse> listForAdmin(String keyword, boolean includeDeleted, Pageable pageable) {
        String kw = (keyword != null && !keyword.isBlank()) ? keyword.trim() : "";
        Page<Member> page = memberRepository.findAdminMembers(kw, includeDeleted, pageable);
        return page.map(MemberResponse::from);
    }

    /** Admin: get member by id (including deleted). */
    public Member findByIdForAdmin(Long id) {
        return memberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Member not found: " + id));
    }

    /** Admin: change member role. */
    @Transactional
    public MemberResponse updateRole(Long id, MemberRole role) {
        Member member = findByIdForAdmin(id);
        member.setRole(role);
        return MemberResponse.from(member);
    }

    /** Admin: restore withdrawn member. */
    @Transactional
    public MemberResponse restore(Long id) {
        Member member = findByIdForAdmin(id);
        member.restore();
        return MemberResponse.from(member);
    }
}
