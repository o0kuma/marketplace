package com.project.api.web;

import com.project.api.service.AuthService;
import com.project.api.service.MemberService;
import com.project.api.web.dto.ForgotPasswordRequest;
import com.project.api.web.dto.LoginRequest;
import com.project.api.web.dto.LoginResponse;
import com.project.api.web.dto.MemberResponse;
import com.project.api.web.dto.ResetPasswordRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final MemberService memberService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        AuthService.LoginResult result = authService.login(request.getEmail(), request.getPassword());
        return LoginResponse.from(result);
    }

    @GetMapping("/me")
    public MemberResponse me(@AuthenticationPrincipal User user) {
        Long memberId = Long.parseLong(user.getUsername());
        return MemberResponse.from(authService.findById(memberId));
    }

    /** Request password reset link by email. Always returns 204 (no email enumeration). */
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        memberService.requestPasswordReset(request.getEmail());
    }

    /** Reset password with token from email link. */
    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        memberService.resetPassword(request.getToken(), request.getNewPassword());
    }
}
