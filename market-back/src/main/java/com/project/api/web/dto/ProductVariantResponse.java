package com.project.api.web.dto;

import com.project.api.domain.OptionValue;
import com.project.api.domain.Product;
import com.project.api.domain.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

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
        return from(v, null);
    }

    /**
     * @param fallbackOptionValueIds from {@code product_variant_option_values} when JPA collection is empty
     */
    public static ProductVariantResponse from(ProductVariant v, List<Long> fallbackOptionValueIds) {
        List<Long> ids =
                v.getOptionValues().stream()
                        .sorted(Comparator.comparingInt(ov -> ov.getOptionGroup().getSortOrder()))
                        .map(OptionValue::getId)
                        .toList();
        if (ids.isEmpty() && fallbackOptionValueIds != null && !fallbackOptionValueIds.isEmpty()) {
            ids = List.copyOf(fallbackOptionValueIds);
        }
        String summary = v.getOptionSummary();
        if ((summary == null || summary.isBlank()) && !ids.isEmpty()) {
            summary = optionNamesJoined(v.getProduct(), ids);
        }
        return ProductVariantResponse.builder()
                .id(v.getId())
                .price(v.getPrice())
                .stockQuantity(v.getStockQuantity())
                .sku(v.getSku())
                .optionSummary(summary)
                .optionValueIds(ids)
                .build();
    }

    private static String optionNamesJoined(Product product, List<Long> orderedValueIds) {
        if (product == null || orderedValueIds == null || orderedValueIds.isEmpty()) {
            return "";
        }
        Map<Long, OptionValue> byId = new HashMap<>();
        product.getOptionGroups().forEach(g -> g.getOptionValuesOrdered().forEach(ov -> byId.put(ov.getId(), ov)));
        return orderedValueIds.stream()
                .map(byId::get)
                .filter(Objects::nonNull)
                .map(OptionValue::getName)
                .collect(Collectors.joining(" / "));
    }
}
