package com.project.api.web;

import com.project.api.service.MemberService;
import com.project.api.service.QuestionService;
import com.project.api.service.ReviewService;
import com.project.api.web.dto.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/members")
@RequiredArgsConstructor
public class MemberController {

    private final MemberService memberService;
    private final ReviewService reviewService;
    private final QuestionService questionService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public MemberResponse signup(@Valid @RequestBody MemberRequest request) {
        return memberService.signup(request);
    }

    @GetMapping("/me")
    public MemberResponse getMe(@AuthenticationPrincipal User user) {
        Long memberId = Long.parseLong(user.getUsername());
        return MemberResponse.from(memberService.findById(memberId));
    }

    @PatchMapping("/me")
    public MemberResponse updateMe(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody MemberUpdateRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return memberService.updateProfile(memberId, request);
    }

    @PatchMapping("/me/password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody PasswordChangeRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        memberService.changePassword(memberId, request.getCurrentPassword(), request.getNewPassword());
    }

    @DeleteMapping("/me")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void withdraw(@AuthenticationPrincipal User user) {
        Long memberId = Long.parseLong(user.getUsername());
        memberService.withdraw(memberId);
    }

    @GetMapping("/me/reviews")
    public PageResponse<MyReviewResponse> getMyReviews(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 10) Pageable pageable) {
        Long memberId = Long.parseLong(user.getUsername());
        return reviewService.getMyReviews(memberId, pageable);
    }

    @GetMapping("/me/questions")
    public PageResponse<MyQuestionResponse> getMyQuestions(
            @AuthenticationPrincipal User user,
            @PageableDefault(size = 10) Pageable pageable) {
        Long memberId = Long.parseLong(user.getUsername());
        return questionService.getMyQuestions(memberId, pageable);
    }
}
