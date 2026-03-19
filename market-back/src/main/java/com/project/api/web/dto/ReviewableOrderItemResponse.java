package com.project.api.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReviewableOrderItemResponse {

    private Long orderItemId;
    private Long orderId;
    private String productName;
    private Integer quantity;
    private LocalDateTime orderCompletedAt;

    public static ReviewableOrderItemResponse from(com.project.api.domain.OrderItem item) {
        return ReviewableOrderItemResponse.builder()
                .orderItemId(item.getId())
                .orderId(item.getOrder().getId())
                .productName(item.getProduct().getName())
                .quantity(item.getQuantity())
                .orderCompletedAt(item.getOrder().getUpdatedAt())
                .build();
    }
}
