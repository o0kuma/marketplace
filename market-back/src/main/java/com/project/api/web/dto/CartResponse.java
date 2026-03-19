package com.project.api.web.dto;

import com.project.api.domain.Cart;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.stream.Collectors;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CartResponse {

    private Long cartId;
    private List<CartItemResponse> items;
    private Integer totalAmount;

    public static CartResponse from(Cart cart) {
        List<CartItemResponse> itemResponses = cart.getItems().stream()
                .map(CartItemResponse::from)
                .collect(Collectors.toList());
        int total = itemResponses.stream().mapToInt(CartItemResponse::getSubtotal).sum();
        return CartResponse.builder()
                .cartId(cart.getId())
                .items(itemResponses)
                .totalAmount(total)
                .build();
    }
}
