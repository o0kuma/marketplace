package com.project.api.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("dev")
class ShippingQuoteServiceTest {

    @Autowired
    private ShippingQuoteService shippingQuoteService;

    @Test
    void feeForSubtotal_belowThreshold_returnsFlatFee() {
        assertEquals(3000, shippingQuoteService.feeForSubtotal(10_000));
    }

    @Test
    void feeForSubtotal_atFreeThreshold_returnsZero() {
        assertEquals(0, shippingQuoteService.feeForSubtotal(50_000));
    }

    @Test
    void feeForSubtotal_aboveThreshold_returnsZero() {
        assertEquals(0, shippingQuoteService.feeForSubtotal(100_000));
    }
}
