package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

/**
 * A sellable variant of a product: one combination of option values with its own price and stock.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "product_variants")
public class ProductVariant extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false)
    private Integer price;

    @Column(nullable = false)
    private Integer stockQuantity;

    @Column(length = 64)
    private String sku;

    @ManyToMany
    @JoinTable(
            name = "product_variant_option_values",
            joinColumns = @JoinColumn(name = "variant_id"),
            inverseJoinColumns = @JoinColumn(name = "option_value_id")
    )
    private final List<OptionValue> optionValues = new ArrayList<>();

    @Builder
    public ProductVariant(Product product, Integer price, Integer stockQuantity, String sku) {
        this.product = product;
        this.price = price != null ? price : 0;
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
        this.sku = sku != null && !sku.isBlank() ? sku.trim() : null;
    }

    public void setPrice(Integer price) {
        this.price = price != null ? price : 0;
    }

    public void setStockQuantity(Integer stockQuantity) {
        this.stockQuantity = stockQuantity != null ? stockQuantity : 0;
    }

    public void setSku(String sku) {
        this.sku = sku != null && !sku.isBlank() ? sku.trim() : null;
    }

    /** Human-readable option summary (e.g. "10ml / 빨강"). */
    public String getOptionSummary() {
        return optionValues.stream()
                .sorted(Comparator.comparingInt(ov -> ov.getOptionGroup().getSortOrder()))
                .map(OptionValue::getName)
                .collect(Collectors.joining(" / "));
    }

    public void decreaseStock(int quantity) {
        if (this.stockQuantity < quantity) {
            throw new IllegalStateException("Insufficient stock for variant");
        }
        this.stockQuantity -= quantity;
    }

    public boolean isSoldOut() {
        return stockQuantity <= 0;
    }
}
