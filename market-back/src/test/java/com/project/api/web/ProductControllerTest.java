package com.project.api.web;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.api.domain.Member;
import com.project.api.domain.MemberRole;
import com.project.api.domain.Product;
import com.project.api.domain.ProductStatus;
import com.project.api.repository.MemberRepository;
import com.project.api.repository.ProductRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("dev")
class ProductControllerTest {

    @Autowired
    MockMvc mockMvc;
    @Autowired
    MemberRepository memberRepository;
    @Autowired
    ProductRepository productRepository;
    @Autowired
    PasswordEncoder passwordEncoder;

    @Test
    void list_returns200() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").isArray());
    }

    @Test
    void getById_returns200() throws Exception {
        Member seller = Member.builder()
                .name("Seller")
                .email("seller-product-test@example.com")
                .password(passwordEncoder.encode("password12"))
                .role(MemberRole.SELLER)
                .termsAgreedAt(java.time.LocalDateTime.now())
                .build();
        seller = memberRepository.save(seller);
        Product product = Product.builder()
                .name("Test Product")
                .price(10000)
                .stockQuantity(5)
                .status(ProductStatus.ON_SALE)
                .seller(seller)
                .build();
        product = productRepository.save(product);

        mockMvc.perform(get("/api/products/" + product.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Test Product"))
                .andExpect(jsonPath("$.price").value(10000));
    }
}
