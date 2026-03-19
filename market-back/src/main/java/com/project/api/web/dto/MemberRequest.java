package com.project.api.web.dto;

import com.project.api.domain.MemberRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberRequest {

    @NotBlank(message = "Name is required")
    @Size(max = 100)
    private String name;

    @NotBlank(message = "Email is required")
    @Email
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, max = 100)
    private String password;

    @Size(max = 20)
    private String phone;

    @Size(max = 500)
    private String address;

    @Builder.Default
    private MemberRole role = MemberRole.USER;

    /** When user agreed to terms (required). If null, server uses now(). */
    private LocalDateTime termsAgreedAt;
}
