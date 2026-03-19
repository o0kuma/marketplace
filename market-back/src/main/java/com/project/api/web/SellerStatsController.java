package com.project.api.web;

import com.project.api.service.SellerService;
import com.project.api.web.dto.SellerStatsResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/seller")
@RequiredArgsConstructor
public class SellerStatsController {

    private final SellerService sellerService;

    @GetMapping("/stats")
    public SellerStatsResponse stats(@AuthenticationPrincipal User user) {
        Long sellerId = Long.parseLong(user.getUsername());
        return sellerService.getStats(sellerId);
    }
}
