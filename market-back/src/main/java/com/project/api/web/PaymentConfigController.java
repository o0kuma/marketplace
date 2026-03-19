package com.project.api.web;

import com.project.api.service.PaymentService;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class PaymentConfigController {

    private final PaymentService paymentService;

    @Value("${app.payment.toss.client-key:}")
    private String tossClientKey;

    @GetMapping("/payment")
    public PaymentConfigResponse paymentConfig() {
        boolean useToss = paymentService.isTossConfigured();
        return new PaymentConfigResponse(useToss, useToss ? tossClientKey : null);
    }

    @Getter
    @AllArgsConstructor
    public static class PaymentConfigResponse {
        /** When true, front must use Toss SDK and POST /orders/{id}/pay/confirm. */
        private final boolean useToss;
        /** Toss client key for opening payment window (public). Null when useToss is false. */
        private final String clientKey;
    }
}
