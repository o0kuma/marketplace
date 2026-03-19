package com.project.api.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {

    @NotNull
    private Long productId;

    /** Required when product has options. */
    private Long productVariantId;

    @NotNull
    @Min(1)
    private Integer quantity;
}
