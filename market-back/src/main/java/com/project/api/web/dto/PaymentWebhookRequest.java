package com.project.api.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Server-to-server payment confirmation (e.g. Toss callback). Secret via header X-Webhook-Secret.
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PaymentWebhookRequest {

    @NotNull
    private Long orderId;

    @NotNull
    private Integer amount;

    @NotBlank
    private String pgTransactionId;
}
