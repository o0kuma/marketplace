package com.project.api.service;

import com.project.api.config.MarketShippingProperties;
import com.project.api.web.dto.ShippingQuoteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ShippingQuoteService {

    private final MarketShippingProperties props;

    /** @deprecated use {@link #feeForSubtotal(int, String)} */
    @Deprecated
    public int feeForSubtotal(int subtotalKrw) {
        return feeForSubtotal(subtotalKrw, ShippingCountry.KR);
    }

    public int feeForSubtotal(int subtotalKrw, String countryCode) {
        String cc = ShippingCountry.normalize(countryCode);
        if (ShippingCountry.isDomestic(cc, props.getDomesticCountry())) {
            return domesticFee(subtotalKrw);
        }
        return internationalFee(subtotalKrw);
    }

    private int domesticFee(int subtotalKrw) {
        if (subtotalKrw <= 0) {
            return props.getFeeKrw();
        }
        if (subtotalKrw >= props.getFreeThresholdKrw()) {
            return 0;
        }
        return props.getFeeKrw();
    }

    private int internationalFee(int subtotalKrw) {
        int threshold = props.getInternationalFreeThresholdKrw();
        if (threshold > 0 && subtotalKrw >= threshold) {
            return 0;
        }
        if (subtotalKrw <= 0) {
            return props.getInternationalFeeKrw();
        }
        return props.getInternationalFeeKrw();
    }

    /** @deprecated use {@link #quote(int, String)} */
    @Deprecated
    public ShippingQuoteResponse quote(int subtotalKrw) {
        return quote(subtotalKrw, ShippingCountry.KR);
    }

    public ShippingQuoteResponse quote(int subtotalKrw, String countryCode) {
        String cc = ShippingCountry.normalize(countryCode);
        boolean domestic = ShippingCountry.isDomestic(cc, props.getDomesticCountry());
        int fee = domestic ? domesticFee(subtotalKrw) : internationalFee(subtotalKrw);
        int threshold = domestic ? props.getFreeThresholdKrw() : Math.max(0, props.getInternationalFreeThresholdKrw());
        return ShippingQuoteResponse.builder()
                .countryCode(cc)
                .domestic(domestic)
                .subtotalKrw(subtotalKrw)
                .shippingFeeKrw(fee)
                .totalKrw(subtotalKrw + fee)
                .freeShippingThresholdKrw(threshold)
                .build();
    }
}
