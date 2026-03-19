package com.project.api.web.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class CartCheckoutPreviewRequest {

    /** Cart line ids to include; empty = all items in cart */
    private List<Long> cartItemIds = new ArrayList<>();
}
