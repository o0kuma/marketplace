package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private Integer orderPrice;

    @Builder
    public OrderItem(Order order, Product product, ProductVariant productVariant, int quantity, int orderPrice) {
        this.order = order;
        this.product = product;
        this.productVariant = productVariant;
        this.quantity = quantity;
        this.orderPrice = orderPrice;
    }

    /** Option summary for display (e.g. "10ml / 빨강"). */
    public String getOptionSummary() {
        return productVariant != null ? productVariant.getOptionSummary() : null;
    }
}
