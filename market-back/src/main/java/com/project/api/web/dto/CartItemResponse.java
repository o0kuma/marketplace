package com.project.api.web.dto;

import com.project.api.domain.CartItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartItemResponse {

    private Long id;
    private Long productId;
    private Long productVariantId;
    private String productName;
    private String optionSummary;
    private Integer price;
    private Integer quantity;
    private Integer subtotal;

    public static CartItemResponse from(CartItem item) {
        int unitPrice = item.getUnitPrice();
        int subtotal = unitPrice * item.getQuantity();
        return CartItemResponse.builder()
                .id(item.getId())
                .productId(item.getProduct().getId())
                .productVariantId(item.getProductVariant() != null ? item.getProductVariant().getId() : null)
                .productName(item.getProduct().getName())
                .optionSummary(item.getProductVariant() != null ? item.getProductVariant().getOptionSummary() : null)
                .price(unitPrice)
                .quantity(item.getQuantity())
                .subtotal(subtotal)
                .build();
    }
}
