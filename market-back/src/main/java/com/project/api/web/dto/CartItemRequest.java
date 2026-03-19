package com.project.api.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CartItemRequest {

    @NotNull
    private Long productId;

    /** Required when product has options; must be a variant of this product. */
    private Long productVariantId;

    @NotNull
    @Min(1)
    private Integer quantity;
}
