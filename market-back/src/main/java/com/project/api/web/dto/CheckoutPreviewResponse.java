package com.project.api.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CheckoutPreviewResponse {

    private List<CheckoutPreviewLineResponse> lines;
    private int subtotalKrw;
    private int shippingFeeKrw;
    private int totalKrw;
    private int freeShippingThresholdKrw;
}
