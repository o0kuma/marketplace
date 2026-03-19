package com.project.api.web;

import com.project.api.service.QuestionService;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.QuestionResponse;
import com.project.api.web.dto.AnswerRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/seller/questions")
@RequiredArgsConstructor
public class SellerQuestionController {

    private final QuestionService questionService;

    @GetMapping
    public PageResponse<QuestionResponse> list(
            @AuthenticationPrincipal User user,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Long sellerId = Long.parseLong(user.getUsername());
        Pageable pageable = PageRequest.of(page, size);
        return questionService.getBySellerProduct(sellerId, pageable);
    }

    @PatchMapping("/{id}/answer")
    public QuestionResponse answer(
            @AuthenticationPrincipal User user,
            @PathVariable Long id,
            @RequestBody AnswerRequest request) {
        Long sellerId = Long.parseLong(user.getUsername());
        String answer = request != null ? request.getAnswer() : null;
        return questionService.answer(id, sellerId, answer);
    }
}
