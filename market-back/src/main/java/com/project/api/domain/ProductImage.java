package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Product image for multi-image gallery. Ordered by sortOrder.
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "product_images")
public class ProductImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id", nullable = false)
    private Product product;

    @Column(nullable = false, length = 512)
    private String imageUrl;

    @Column(nullable = false)
    private int sortOrder;

    @Builder
    public ProductImage(Product product, String imageUrl, int sortOrder) {
        this.product = product;
        this.imageUrl = imageUrl;
        this.sortOrder = sortOrder;
    }
}
