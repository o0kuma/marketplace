package com.project.api.web.dto;

import com.project.api.domain.OrderItem;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderItemResponse {

    private Long productId;
    private Long productVariantId;
    private String productName;
    private String optionSummary;
    private Integer quantity;
    private Integer orderPrice;

    public static OrderItemResponse from(OrderItem item) {
        return OrderItemResponse.builder()
                .productId(item.getProduct().getId())
                .productVariantId(item.getProductVariant() != null ? item.getProductVariant().getId() : null)
                .productName(item.getProduct().getName())
                .optionSummary(item.getOptionSummary())
                .quantity(item.getQuantity())
                .orderPrice(item.getOrderPrice())
                .build();
    }
}
