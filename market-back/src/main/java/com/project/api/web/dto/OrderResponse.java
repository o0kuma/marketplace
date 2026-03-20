package com.project.api.web.dto;

import com.project.api.domain.Order;
import com.project.api.domain.OrderStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrderResponse {

    private Long id;
    private Long buyerId;
    private OrderStatus status;
    private Integer totalAmount;
    private Integer subtotalAmount;
    private Integer shippingFee;
    private String recipientName;
    private String recipientPhone;
    private String recipientAddress;
    private String trackingNumber;
    private Boolean refunded;
    private List<OrderItemResponse> items;

    public static OrderResponse from(Order order) {
        return from(order, false);
    }

    public static OrderResponse from(Order order, boolean refunded) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(OrderItemResponse::from)
                .toList();
        int ship = order.getShippingFee() != null ? order.getShippingFee() : 0;
        int sub = Math.max(0, order.getTotalAmount() - ship);
        return OrderResponse.builder()
                .id(order.getId())
                .buyerId(order.getBuyer().getId())
                .status(order.getStatus())
                .totalAmount(order.getTotalAmount())
                .subtotalAmount(sub)
                .shippingFee(ship)
                .recipientName(order.getRecipientName())
                .recipientPhone(order.getRecipientPhone())
                .recipientAddress(order.getRecipientAddress())
                .trackingNumber(order.getTrackingNumber())
                .refunded(refunded)
                .items(itemResponses)
                .build();
    }
}
