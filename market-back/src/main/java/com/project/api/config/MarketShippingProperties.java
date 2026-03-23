package com.project.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Shipping fee policy. Domestic ({@code domesticCountry}) uses threshold + flat fee;
 * other countries use {@code international*} settings (still quoted in KRW for this storefront).
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "market.shipping")
public class MarketShippingProperties {

    /** ISO 3166-1 alpha-2 country that uses domestic rules (default Korea). */
    private String domesticCountry = "KR";

    /** Subtotal at or above this (KRW) → domestic shipping fee is 0 */
    private int freeThresholdKrw = 50_000;

    /** Applied for domestic when subtotal is below free threshold */
    private int feeKrw = 3_000;

    /** Flat international shipping fee (KRW) when below international free threshold */
    private int internationalFeeKrw = 20_000;

    /**
     * Subtotal (KRW) at or above this → international shipping is 0.
     * Set to 0 to disable free international shipping.
     */
    private int internationalFreeThresholdKrw = 0;
}
