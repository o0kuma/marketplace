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
    /** ISO 3166-1 alpha-2 shipping country */
    private String recipientCountry;
    /** True when recipient country matches storefront domestic country (e.g. Toss eligibility). */
    private Boolean domesticShipping;
    private String trackingNumber;
    /** True when {@link #trackingNumber} is present and non-blank (trimmed). */
    private Boolean trackingEntered;
    /**
     * True when order is paid or marked shipping but seller still must enter a tracking number
     * (aligns with seller "pending shipment" queue).
     */
    private Boolean needsTrackingInput;
    private Boolean refunded;
    private List<OrderItemResponse> items;

    public static OrderResponse from(Order order) {
        return from(order, false, true);
    }

    public static OrderResponse from(Order order, boolean refunded, boolean domesticShipping) {
        List<OrderItemResponse> itemResponses = order.getItems().stream()
                .map(OrderItemResponse::from)
                .toList();
        int ship = order.getShippingFee() != null ? order.getShippingFee() : 0;
        int sub = Math.max(0, order.getTotalAmount() - ship);
        boolean entered = order.hasTrackingNumber();
        OrderStatus st = order.getStatus();
        boolean needsTracking = (st == OrderStatus.PAYMENT_COMPLETE || st == OrderStatus.SHIPPING) && !entered;
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
                .recipientCountry(order.recipientCountryOrDefault())
                .domesticShipping(domesticShipping)
                .trackingNumber(order.getTrackingNumber())
                .trackingEntered(entered)
                .needsTrackingInput(needsTracking)
                .refunded(refunded)
                .items(itemResponses)
                .build();
    }
}
