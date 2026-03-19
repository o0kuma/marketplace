package com.project.api.web.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShippingQuoteResponse {

    private int subtotalKrw;
    private int shippingFeeKrw;
    private int totalKrw;
    private int freeShippingThresholdKrw;
}
