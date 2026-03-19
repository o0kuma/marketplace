package com.project.api.web.dto;

import com.project.api.domain.ReturnRequestType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequestCreateRequest {

    @NotNull
    private ReturnRequestType type;

    private String reason;
}
