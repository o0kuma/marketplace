package com.project.api.service;

import com.project.api.config.MarketShippingProperties;
import com.project.api.web.dto.ShippingQuoteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ShippingQuoteService {

    private final MarketShippingProperties props;

    public int feeForSubtotal(int subtotalKrw) {
        if (subtotalKrw <= 0) {
            return props.getFeeKrw();
        }
        if (subtotalKrw >= props.getFreeThresholdKrw()) {
            return 0;
        }
        return props.getFeeKrw();
    }

    public ShippingQuoteResponse quote(int subtotalKrw) {
        int fee = feeForSubtotal(subtotalKrw);
        return ShippingQuoteResponse.builder()
                .subtotalKrw(subtotalKrw)
                .shippingFeeKrw(fee)
                .totalKrw(subtotalKrw + fee)
                .freeShippingThresholdKrw(props.getFreeThresholdKrw())
                .build();
    }
}
