package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Member extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, length = 255)
    private String password;

    @Column(length = 20)
    private String phone;

    @Column(length = 500)
    private String address;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private MemberRole role = MemberRole.USER;

    @Column(nullable = false)
    private LocalDateTime termsAgreedAt;

    @Column
    private LocalDateTime deletedAt;

    @Column(length = 500)
    private String profileImageUrl;

    @Column(length = 64)
    private String passwordResetToken;

    @Column
    private LocalDateTime passwordResetExpiresAt;

    @Builder
    public Member(String name, String email, String password, String phone, String address,
                  MemberRole role, LocalDateTime termsAgreedAt) {
        this.name = name;
        this.email = email;
        this.password = password;
        this.phone = phone;
        this.address = address;
        this.role = role != null ? role : MemberRole.USER;
        this.termsAgreedAt = termsAgreedAt != null ? termsAgreedAt : LocalDateTime.now();
    }

    public void updateProfile(String name, String phone, String address) {
        this.name = name != null ? name : this.name;
        this.phone = phone;
        this.address = address;
    }

    public void setProfileImageUrl(String profileImageUrl) {
        this.profileImageUrl = profileImageUrl != null && !profileImageUrl.isBlank() ? profileImageUrl.trim() : null;
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    public void setPassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void markDeleted() {
        this.deletedAt = LocalDateTime.now();
    }

    public void restore() {
        this.deletedAt = null;
    }

    public void setRole(MemberRole role) {
        this.role = role != null ? role : MemberRole.USER;
    }

    public void setPasswordResetToken(String token, LocalDateTime expiresAt) {
        this.passwordResetToken = token;
        this.passwordResetExpiresAt = expiresAt;
    }

    public void clearPasswordResetToken() {
        this.passwordResetToken = null;
        this.passwordResetExpiresAt = null;
    }

    public boolean isPasswordResetTokenValid(String token) {
        return token != null && token.equals(passwordResetToken)
                && passwordResetExpiresAt != null && LocalDateTime.now().isBefore(passwordResetExpiresAt);
    }
}
