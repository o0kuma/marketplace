package com.project.api.web.dto;

import com.project.api.domain.OptionGroup;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OptionGroupResponse {

    private Long id;
    private String name;
    private int sortOrder;
    private List<OptionValueResponse> values;

    public static OptionGroupResponse from(OptionGroup g) {
        List<OptionValueResponse> values = g.getOptionValuesOrdered().stream()
                .map(OptionValueResponse::from)
                .toList();
        return new OptionGroupResponse(g.getId(), g.getName(), g.getSortOrder(), values);
    }
}
