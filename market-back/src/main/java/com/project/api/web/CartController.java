package com.project.api.web;

import com.project.api.service.CartService;
import com.project.api.web.dto.CartCheckoutPreviewRequest;
import com.project.api.web.dto.CartItemRequest;
import com.project.api.web.dto.CartResponse;
import com.project.api.web.dto.CheckoutPreviewResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @GetMapping
    public CartResponse getCart(@AuthenticationPrincipal UserDetails user) {
        Long memberId = Long.parseLong(user.getUsername());
        return cartService.getCart(memberId);
    }

    @GetMapping("/count")
    public int getCartCount(@AuthenticationPrincipal UserDetails user) {
        Long memberId = Long.parseLong(user.getUsername());
        return cartService.getCartItemCount(memberId);
    }

    @PostMapping("/items")
    @ResponseStatus(HttpStatus.CREATED)
    public CartResponse addItem(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody CartItemRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return cartService.addItem(memberId, request);
    }

    @PatchMapping("/items/{cartItemId}")
    public CartResponse updateItem(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long cartItemId,
            @RequestParam int quantity) {
        Long memberId = Long.parseLong(user.getUsername());
        return cartService.updateItemQuantity(memberId, cartItemId, quantity);
    }

    @DeleteMapping("/items/{cartItemId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Long cartItemId) {
        Long memberId = Long.parseLong(user.getUsername());
        cartService.removeItem(memberId, cartItemId);
    }

    @PostMapping("/checkout-preview")
    public CheckoutPreviewResponse checkoutPreview(
            @AuthenticationPrincipal UserDetails user,
            @RequestBody(required = false) CartCheckoutPreviewRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        if (request == null) {
            request = new CartCheckoutPreviewRequest();
        }
        return cartService.previewCheckout(memberId, request);
    }
}
