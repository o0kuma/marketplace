package com.project.api.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.api.service.PaymentService;
import com.project.api.web.dto.PaymentWebhookRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = PaymentWebhookController.class)
@Import(com.project.api.web.ApiExceptionHandler.class)
class PaymentWebhookControllerTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;
    @MockBean
    PaymentService paymentService;

    @Test
    void confirm_delegatesToPaymentService() throws Exception {
        PaymentWebhookRequest body = new PaymentWebhookRequest(42L, 15000, "pg-tx-abc");
        mockMvc.perform(post("/api/webhooks/payment/confirm")
                        .header("X-Webhook-Secret", "my-secret")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isNoContent());
        verify(paymentService).completeFromWebhook(42L, 15000, "pg-tx-abc", "my-secret");
    }
}
