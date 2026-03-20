package com.project.api.web.dto;

import com.project.api.domain.ProductStatus;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class AdminProductBulkStatusRequest {
    @NotEmpty
    private List<Long> productIds;
    @NotNull
    private ProductStatus status;
}
