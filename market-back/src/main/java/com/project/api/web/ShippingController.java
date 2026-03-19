package com.project.api.web;

import com.project.api.service.ShippingQuoteService;
import com.project.api.web.dto.ShippingQuoteResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/shipping")
@RequiredArgsConstructor
public class ShippingController {

    private final ShippingQuoteService shippingQuoteService;

    @GetMapping("/quote")
    public ShippingQuoteResponse quote(@RequestParam int subtotalKrw) {
        if (subtotalKrw < 0) {
            subtotalKrw = 0;
        }
        return shippingQuoteService.quote(subtotalKrw);
    }
}
