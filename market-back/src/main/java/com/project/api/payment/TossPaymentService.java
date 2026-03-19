package com.project.api.payment;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

/**
 * Calls Toss Payments API for confirm and cancel.
 * See https://docs.tosspayments.com/reference
 */
@Service
@Slf4j
public class TossPaymentService {

    private static final String CONFIRM_URL = "https://api.tosspayments.com/v1/payments/confirm";
    private static final String CANCEL_URL_TEMPLATE = "https://api.tosspayments.com/v1/payments/%s/cancel";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${app.payment.toss.secret-key:}")
    private String secretKey;

    public boolean isConfigured() {
        return secretKey != null && !secretKey.isBlank();
    }

    /**
     * Confirm payment with Toss. Returns payment key on success; throws on failure.
     */
    public String confirm(String paymentKey, String orderId, int amountKrw) {
        if (!isConfigured()) {
            throw new IllegalStateException("Toss Payments secret key is not configured");
        }
        String auth = "Basic " + Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", auth);

        Map<String, Object> body = Map.of(
                "paymentKey", paymentKey,
                "orderId", orderId,
                "amount", amountKrw
        );
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                    CONFIRM_URL,
                    HttpMethod.POST,
                    entity,
                    Map.class
            );
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                String confirmedKey = (String) response.getBody().get("paymentKey");
                log.info("Toss payment confirmed: orderId={}, paymentKey={}", orderId, confirmedKey);
                return confirmedKey != null ? confirmedKey : paymentKey;
            }
        } catch (RestClientException e) {
            log.warn("Toss confirm failed: orderId={}, {}", orderId, e.getMessage());
            throw new IllegalArgumentException("Payment confirmation failed: " + e.getMessage());
        }
        throw new IllegalArgumentException("Payment confirmation failed");
    }

    /**
     * Cancel (refund) payment at Toss. paymentKey is the value we stored in Payment.pgTransactionId.
     */
    public void cancel(String paymentKey, String cancelReason) {
        if (!isConfigured()) {
            throw new IllegalStateException("Toss Payments secret key is not configured");
        }
        String auth = "Basic " + Base64.getEncoder().encodeToString((secretKey + ":").getBytes(StandardCharsets.UTF_8));
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", auth);

        Map<String, Object> body = Map.of(
                "cancelReason", cancelReason != null && !cancelReason.isBlank() ? cancelReason : "고객 요청"
        );
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        String url = String.format(CANCEL_URL_TEMPLATE, paymentKey);

        try {
            restTemplate.exchange(url, HttpMethod.POST, entity, Map.class);
            log.info("Toss payment cancelled: paymentKey={}", paymentKey);
        } catch (RestClientException e) {
            log.warn("Toss cancel failed: paymentKey={}, {}", paymentKey, e.getMessage());
            throw new IllegalArgumentException("Payment cancel failed: " + e.getMessage());
        }
    }
}
