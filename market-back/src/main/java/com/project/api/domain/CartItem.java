package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    private Cart cart;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_variant_id")
    private ProductVariant productVariant;

    @Column(nullable = false)
    private Integer quantity;

    @Builder
    public CartItem(Cart cart, Product product, ProductVariant productVariant, Integer quantity) {
        this.cart = cart;
        this.product = product;
        this.productVariant = productVariant;
        this.quantity = quantity;
    }

    /** Price for this line: variant price if present, else product price. */
    public int getUnitPrice() {
        return productVariant != null ? productVariant.getPrice() : product.getPrice();
    }

    public void setQuantity(int quantity) {
        this.quantity = quantity;
    }
}
