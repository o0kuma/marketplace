package com.project.api.web.dto;

import com.project.api.domain.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductVariantResponse {

    private Long id;
    private Integer price;
    private Integer stockQuantity;
    private String sku;
    private String optionSummary;
    private List<Long> optionValueIds;

    public static ProductVariantResponse from(ProductVariant v) {
        List<Long> ids = v.getOptionValues().stream()
                .sorted(java.util.Comparator.comparingInt(ov -> ov.getOptionGroup().getSortOrder()))
                .map(ov -> ov.getId())
                .toList();
        return ProductVariantResponse.builder()
                .id(v.getId())
                .price(v.getPrice())
                .stockQuantity(v.getStockQuantity())
                .sku(v.getSku())
                .optionSummary(v.getOptionSummary())
                .optionValueIds(ids)
                .build();
    }
}
