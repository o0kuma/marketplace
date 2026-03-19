package com.project.api.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OrderRequest {

    @NotEmpty(message = "At least one item required")
    @Valid
    private List<OrderItemRequest> items;

    @NotBlank
    @Size(max = 100)
    private String recipientName;

    @NotBlank
    @Size(max = 20)
    private String recipientPhone;

    @NotBlank
    @Size(max = 500)
    private String recipientAddress;
}
