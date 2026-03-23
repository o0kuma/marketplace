package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "orders")
public class Order extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "buyer_id", nullable = false)
    private Member buyer;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.ORDERED;

    @Column(nullable = false)
    private Integer totalAmount;

    /** Shipping fee included in totalAmount (KRW). */
    @Column(nullable = false)
    private Integer shippingFee = 0;

    @Column(nullable = false, length = 100)
    private String recipientName;

    @Column(nullable = false, length = 20)
    private String recipientPhone;

    @Column(nullable = false, length = 500)
    private String recipientAddress;

    /** ISO 3166-1 alpha-2 shipping country */
    @Column(name = "recipient_country", length = 2)
    private String recipientCountry;

    @Column(length = 100)
    private String trackingNumber;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<OrderItem> items = new ArrayList<>();

    @Builder
    public Order(Member buyer, OrderStatus status, Integer totalAmount, Integer shippingFee,
                 String recipientName, String recipientPhone, String recipientAddress, String recipientCountry) {
        this.buyer = buyer;
        this.status = status != null ? status : OrderStatus.ORDERED;
        this.totalAmount = totalAmount != null ? totalAmount : 0;
        this.shippingFee = shippingFee != null ? shippingFee : 0;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.recipientAddress = recipientAddress;
        this.recipientCountry = recipientCountry;
    }

    public String recipientCountryOrDefault() {
        if (recipientCountry == null || recipientCountry.isBlank()) {
            return "KR";
        }
        return recipientCountry.trim().toUpperCase();
    }

    public void addItem(OrderItem item) {
        items.add(item);
    }

    public void setTotalAmount(int totalAmount) {
        this.totalAmount = totalAmount;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public void setTrackingNumber(String trackingNumber) {
        this.trackingNumber = trackingNumber;
    }

    /** Non-null, non-blank tracking number after trim (for API flags and status checks). */
    public boolean hasTrackingNumber() {
        return trackingNumber != null && !trackingNumber.trim().isEmpty();
    }

    public void setShippingFee(int shippingFee) {
        this.shippingFee = shippingFee;
    }

    public void setRecipientCountry(String recipientCountry) {
        this.recipientCountry = recipientCountry;
    }

    public boolean hasItemFromSeller(Long sellerId) {
        return items.stream().anyMatch(i -> i.getProduct().getSeller().getId().equals(sellerId));
    }
}
