package com.project.api.web.dto;

import com.project.api.domain.Wishlist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Single wishlist item for "my wishlist" list (product summary + addedAt).
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WishlistItemResponse {

    private Long wishlistId;
    private Long productId;
    private String productName;
    private String imageUrl;
    private Integer price;
    private LocalDateTime addedAt;

    public static WishlistItemResponse from(Wishlist w) {
        var p = w.getProduct();
        return WishlistItemResponse.builder()
                .wishlistId(w.getId())
                .productId(p.getId())
                .productName(p.getName())
                .imageUrl(p.getImageUrl())
                .price(p.getPrice())
                .addedAt(w.getCreatedAt())
                .build();
    }
}
