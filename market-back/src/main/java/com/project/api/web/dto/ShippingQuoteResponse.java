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

    /** ISO 3166-1 alpha-2 country this quote applies to */
    private String countryCode;
    /** True when country matches configured domestic country */
    private boolean domestic;
    private int subtotalKrw;
    private int shippingFeeKrw;
    private int totalKrw;
    /** Free-shipping threshold for this lane (KRW); 0 means no free-shipping rule */
    private int freeShippingThresholdKrw;
}
