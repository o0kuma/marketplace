package com.project.api.web.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ApiErrorResponse {

    private String code;
    private String message;
    private String errors;

    public static ApiErrorResponse of(String code, String message, String errors) {
        return ApiErrorResponse.builder()
                .code(code)
                .message(message)
                .errors(errors)
                .build();
    }
}
