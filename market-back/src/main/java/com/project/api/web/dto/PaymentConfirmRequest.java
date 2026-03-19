package com.project.api.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Request body for Toss Payments confirm API (after client-side payment success).
 * orderId is the value sent to Toss (e.g. "order-123").
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentConfirmRequest {

    @NotBlank
    private String paymentKey;

    /** Toss orderId (e.g. "order-123") — must match what was sent when opening payment. */
    @NotBlank
    private String orderId;

    @NotNull
    @Min(1)
    private Integer amount;
}
