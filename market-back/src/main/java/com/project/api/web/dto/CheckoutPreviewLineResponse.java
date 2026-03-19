package com.project.api.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutPreviewLineResponse {

    private Long cartItemId;
    private Long productId;
    private Long productVariantId;
    private String productName;
    private String optionSummary;
    private int price;
    private int quantity;
    private int lineTotal;
}
