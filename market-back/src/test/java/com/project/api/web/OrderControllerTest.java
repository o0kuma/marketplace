package com.project.api.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.api.web.dto.MemberRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("dev")
class OrderControllerTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    ObjectMapper objectMapper;

    String obtainToken() throws Exception {
        MemberRequest signup = MemberRequest.builder()
                .name("Order Test User")
                .email("ordertest@example.com")
                .password("password12")
                .termsAgreedAt(LocalDateTime.now())
                .build();
        mockMvc.perform(post("/api/members")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(signup)))
                .andExpect(status().isCreated());

        ResultActions login = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"ordertest@example.com\",\"password\":\"password12\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isString());
        return objectMapper.readTree(login.andReturn().getResponse().getContentAsString()).get("token").asText();
    }

    @Test
    void myOrders_authenticated_returns200() throws Exception {
        String token = obtainToken();
        mockMvc.perform(get("/api/orders")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }
}
