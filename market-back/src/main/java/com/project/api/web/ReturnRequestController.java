package com.project.api.web;

import com.project.api.service.ReturnRequestService;
import com.project.api.web.dto.ReturnRequestCreateRequest;
import com.project.api.web.dto.ReturnRequestResponse;
import com.project.api.web.dto.ReturnRequestUpdateRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class ReturnRequestController {

    private final ReturnRequestService returnRequestService;

    @PostMapping("/{orderId}/return-requests")
    @ResponseStatus(HttpStatus.CREATED)
    public ReturnRequestResponse create(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId,
            @Valid @RequestBody ReturnRequestCreateRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return returnRequestService.create(orderId, memberId, request);
    }

    @GetMapping("/{orderId}/return-requests")
    public List<ReturnRequestResponse> list(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId) {
        Long memberId = Long.parseLong(user.getUsername());
        return returnRequestService.listByOrder(orderId, memberId);
    }

    @PatchMapping("/{orderId}/return-requests/{returnRequestId}")
    public ReturnRequestResponse updateStatus(
            @AuthenticationPrincipal User user,
            @PathVariable Long orderId,
            @PathVariable Long returnRequestId,
            @Valid @RequestBody ReturnRequestUpdateRequest request) {
        Long memberId = Long.parseLong(user.getUsername());
        return returnRequestService.updateStatus(orderId, returnRequestId, memberId, request);
    }
}
