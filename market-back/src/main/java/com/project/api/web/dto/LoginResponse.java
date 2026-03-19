package com.project.api.web.dto;

import com.project.api.service.AuthService;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {

    private String token;
    private MemberResponse member;

    public static LoginResponse from(AuthService.LoginResult result) {
        return new LoginResponse(result.token(), result.member());
    }
}
