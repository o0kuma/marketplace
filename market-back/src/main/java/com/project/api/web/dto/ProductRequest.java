package com.project.api.web.dto;

import com.project.api.domain.ProductStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductRequest {

    @NotBlank(message = "Product name is required")
    @Size(max = 200)
    private String name;

    @Size(max = 2000)
    private String description;

    @Size(max = 512)
    private String imageUrl;

    /** Multiple image URLs (first = representative). When set, overrides imageUrl for gallery. */
    private java.util.List<String> imageUrls;

    @NotNull
    @Min(0)
    private Integer price;

    @NotNull
    @Min(0)
    private Integer stockQuantity;

    private Long categoryId;

    /** Optional; for update only. ON_SALE or SOLD_OUT. */
    private ProductStatus status;

    /** Option groups (e.g. "용량", "색상"). When non-empty, variants must be provided. */
    private java.util.List<OptionGroupInput> optionGroups;

    /** Variants (price/stock per option combination). Required when optionGroups is non-empty. */
    private java.util.List<ProductVariantInput> variants;
}
