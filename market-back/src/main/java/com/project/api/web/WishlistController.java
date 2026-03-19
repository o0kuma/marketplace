package com.project.api.web;

import com.project.api.service.WishlistService;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.WishlistItemResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

/**
 * Wishlist API: add/remove product, list my wishlist. All require authentication.
 */
@RestController
@RequestMapping("/api/wishlist")
@RequiredArgsConstructor
public class WishlistController {

    private final WishlistService wishlistService;

    @GetMapping
    public PageResponse<WishlistItemResponse> getMyWishlist(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 20) Pageable pageable) {
        Long memberId = Long.parseLong(user.getUsername());
        return wishlistService.getMyWishlist(memberId, pageable);
    }

    @PostMapping("/products/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void add(
            @AuthenticationPrincipal User user,
            @PathVariable Long productId) {
        Long memberId = Long.parseLong(user.getUsername());
        wishlistService.add(memberId, productId);
    }

    @DeleteMapping("/products/{productId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void remove(
            @AuthenticationPrincipal User user,
            @PathVariable Long productId) {
        Long memberId = Long.parseLong(user.getUsername());
        wishlistService.remove(memberId, productId);
    }

    @GetMapping("/contains")
    public boolean contains(
            @AuthenticationPrincipal User user,
            @RequestParam Long productId) {
        Long memberId = Long.parseLong(user.getUsername());
        return wishlistService.isInWishlist(memberId, productId);
    }
}
