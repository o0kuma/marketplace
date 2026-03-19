package com.project.api.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Variant definition: price, stock, and option value names in option-group order.
 * e.g. optionValueNames = ["10ml", "빨강"] means first group's "10ml", second group's "빨강".
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProductVariantInput {

    @NotNull
    @Min(0)
    private Integer price;

    @NotNull
    @Min(0)
    private Integer stockQuantity;

    @Size(max = 64)
    private String sku;

    /** Option value names in the same order as product's option groups. */
    private List<String> optionValueNames;
}
