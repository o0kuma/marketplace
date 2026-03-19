package com.project.api.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Shipping fee policy: free shipping when subtotal (KRW) meets threshold; otherwise flat fee.
 */
@Getter
@Setter
@Component
@ConfigurationProperties(prefix = "market.shipping")
public class MarketShippingProperties {

    /** Subtotal at or above this (KRW) → shipping fee is 0 */
    private int freeThresholdKrw = 50_000;

    /** Applied when subtotal is below free threshold */
    private int feeKrw = 3_000;
}
