package com.project.api.web;

import com.project.api.service.PaymentService;
import com.project.api.web.dto.PaymentWebhookRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks/payment")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final PaymentService paymentService;

    @PostMapping("/confirm")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void confirm(
            @RequestHeader("X-Webhook-Secret") String webhookSecret,
            @Valid @RequestBody PaymentWebhookRequest body) {
        paymentService.completeFromWebhook(
                body.getOrderId(),
                body.getAmount(),
                body.getPgTransactionId(),
                webhookSecret);
    }
}
