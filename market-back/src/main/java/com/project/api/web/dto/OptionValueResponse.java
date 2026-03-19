package com.project.api.web.dto;

import com.project.api.domain.OptionValue;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OptionValueResponse {

    private Long id;
    private String name;
    private int sortOrder;

    public static OptionValueResponse from(OptionValue v) {
        return new OptionValueResponse(v.getId(), v.getName(), v.getSortOrder());
    }
}
