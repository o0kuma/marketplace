package com.project.api.web;

import com.project.api.domain.Product;
import com.project.api.domain.Question;
import com.project.api.repository.ProductRepository;
import com.project.api.repository.QuestionRepository;
import com.project.api.service.MemberService;
import com.project.api.web.dto.QuestionRequest;
import com.project.api.web.dto.QuestionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Q&A skeleton: list and create questions for a product.
 */
@RestController
@RequestMapping("/api/products/{productId}/questions")
@RequiredArgsConstructor
public class QuestionController {

    private final QuestionRepository questionRepository;
    private final ProductRepository productRepository;
    private final MemberService memberService;

    @GetMapping
    public List<QuestionResponse> list(
            @PathVariable Long productId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return questionRepository.findByProductIdOrderByCreatedAtDesc(productId, pageable)
                .stream()
                .map(QuestionResponse::from)
                .collect(Collectors.toList());
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuestionResponse create(
            @PathVariable Long productId,
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody QuestionRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new NotFoundException("Product not found: " + productId));
        Question question = Question.builder()
                .product(product)
                .author(memberService.findById(memberId))
                .content(request.getContent().trim())
                .build();
        question = questionRepository.save(question);
        return QuestionResponse.from(question);
    }
}
