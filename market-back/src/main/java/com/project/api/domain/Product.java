package com.project.api.domain;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Product extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    /** Representative image URL (first of productImages, or legacy single image). */
    @Column(length = 512)
    private String imageUrl;

    @Column(nullable = false)
    private Integer price;

    @Column(nullable = false)
    private Integer stockQuantity;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ProductStatus status = ProductStatus.ON_SALE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "seller_id", nullable = false)
    private Member seller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id")
    private Category category;

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ProductImage> productImages = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<OptionGroup> optionGroups = new ArrayList<>();

    @OneToMany(mappedBy = "product", cascade = CascadeType.ALL, orphanRemoval = true)
    private final List<ProductVariant> variants = new ArrayList<>();

    /** True when this product has option groups and variants (option-based selling). */
    public boolean hasVariants() {
        return !variants.isEmpty();
    }

    @Builder
    public Product(String name, String description, String imageUrl, Integer price, Integer stockQuantity, ProductStatus status, Member seller, Category category) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.status = status != null ? status : ProductStatus.ON_SALE;
        this.seller = seller;
        this.category = category;
    }

    /** Soft delete: set status to DELETED. */
    public void markDeleted() {
        this.status = ProductStatus.DELETED;
    }

    /** Update name, description, imageUrl, price, stock, category. */
    public void updateInfo(String name, String description, String imageUrl, Integer price, Integer stockQuantity, Category category) {
        this.name = name;
        this.description = description;
        this.imageUrl = imageUrl;
        this.price = price;
        this.stockQuantity = stockQuantity;
        this.category = category;
    }

    public void setStatus(ProductStatus status) {
        this.status = status != null ? status : ProductStatus.ON_SALE;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    /** Replace image list; sets imageUrl to first URL. Call after product is managed. */
    public void setProductImages(List<String> imageUrls) {
        productImages.clear();
        if (imageUrls != null && !imageUrls.isEmpty()) {
            for (int i = 0; i < imageUrls.size(); i++) {
                String url = imageUrls.get(i);
                if (url != null && !url.isBlank()) {
                    productImages.add(ProductImage.builder().product(this).imageUrl(url.trim()).sortOrder(i).build());
                }
            }
            if (!productImages.isEmpty()) {
                this.imageUrl = productImages.get(0).getImageUrl();
            }
        }
    }

    /** Ordered list of image URLs (by sortOrder). */
    public List<String> getImageUrls() {
        return productImages.stream()
                .sorted(Comparator.comparingInt(ProductImage::getSortOrder))
                .map(ProductImage::getImageUrl)
                .toList();
    }

    /** Decrease stock and set SOLD_OUT when zero. Only for products without variants. */
    public void decreaseStock(int quantity) {
        if (hasVariants()) {
            throw new IllegalStateException("Use variant decreaseStock for option-based product");
        }
        if (this.stockQuantity < quantity) {
            throw new IllegalStateException("Insufficient stock");
        }
        this.stockQuantity -= quantity;
        if (this.stockQuantity == 0) {
            this.status = ProductStatus.SOLD_OUT;
        }
    }

    /** Update SOLD_OUT status when all variants are sold out. */
    public void updateStatusFromVariants() {
        if (!hasVariants()) return;
        boolean allOut = variants.stream().allMatch(ProductVariant::isSoldOut);
        if (allOut) {
            this.status = ProductStatus.SOLD_OUT;
        }
    }
}
