package com.project.api.service;

import com.project.api.domain.Question;
import com.project.api.repository.QuestionRepository;
import com.project.api.web.ForbiddenException;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.MyQuestionResponse;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.QuestionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Question listing by product and "my questions" for member; seller answer.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuestionService {

    private final QuestionRepository questionRepository;

    public PageResponse<MyQuestionResponse> getMyQuestions(Long memberId, Pageable pageable) {
        Page<Question> page = questionRepository.findByAuthorIdOrderByCreatedAtDesc(memberId, pageable);
        return PageResponse.of(page.map(MyQuestionResponse::from));
    }

    public PageResponse<QuestionResponse> getBySellerProduct(Long sellerId, Pageable pageable) {
        Page<Question> page = questionRepository.findByProduct_Seller_IdOrderByCreatedAtDesc(sellerId, pageable);
        return PageResponse.of(page.map(QuestionResponse::from));
    }

    @Transactional
    public QuestionResponse answer(Long questionId, Long sellerId, String answer) {
        Question question = questionRepository.findById(questionId)
                .orElseThrow(() -> new NotFoundException("Question not found: " + questionId));
        if (!question.getProduct().getSeller().getId().equals(sellerId)) {
            throw new ForbiddenException("Not the product seller");
        }
        question.setSellerAnswer(answer != null ? answer.trim() : null);
        return QuestionResponse.from(question);
    }
}
