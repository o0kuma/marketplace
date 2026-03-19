package com.project.api.web.dto;

import com.project.api.domain.ReturnRequestStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequestUpdateRequest {

    @NotNull
    private ReturnRequestStatus status;

    private String sellerComment;
}
