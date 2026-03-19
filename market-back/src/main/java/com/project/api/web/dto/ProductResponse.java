package com.project.api.web.dto;

import com.project.api.domain.OptionGroup;
import com.project.api.domain.Product;
import com.project.api.domain.ProductStatus;
import com.project.api.domain.ProductVariant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProductResponse {

    private Long id;
    private String name;
    private String description;
    private String imageUrl;
    private List<String> imageUrls;
    private Integer price;
    private Integer stockQuantity;
    private ProductStatus status;
    private Long sellerId;
    private String sellerName;
    private Long categoryId;
    private String categoryName;
    private List<OptionGroupResponse> optionGroups;
    private List<ProductVariantResponse> variants;

    public static ProductResponse from(Product product) {
        return from(product, null);
    }

    /**
     * @param variantOptionValueIdsFallback variant id → ordered option value ids from join table when JPA bag is empty
     */
    public static ProductResponse from(Product product, Map<Long, List<Long>> variantOptionValueIdsFallback) {
        List<String> urls = product.getImageUrls();
        String mainUrl = product.getImageUrl();
        if (urls.isEmpty() && mainUrl != null) {
            urls = List.of(mainUrl);
        }
        if (mainUrl == null && !urls.isEmpty()) {
            mainUrl = urls.get(0);
        }
        List<OptionGroupResponse> groups = product.getOptionGroups().stream()
                .sorted(Comparator.comparingInt(OptionGroup::getSortOrder))
                .map(OptionGroupResponse::from)
                .toList();
        Map<Long, List<Long>> fb = variantOptionValueIdsFallback != null ? variantOptionValueIdsFallback : Map.of();
        List<ProductVariantResponse> vars =
                product.getVariants().stream()
                        .map(v -> ProductVariantResponse.from(v, fb.get(v.getId())))
                        .collect(Collectors.toList());
        return ProductResponse.builder()
                .id(product.getId())
                .name(product.getName())
                .description(product.getDescription())
                .imageUrl(mainUrl)
                .imageUrls(urls)
                .price(product.getPrice())
                .stockQuantity(product.getStockQuantity())
                .status(product.getStatus())
                .sellerId(product.getSeller().getId())
                .sellerName(product.getSeller().getName())
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .optionGroups(groups)
                .variants(vars)
                .build();
    }
}
