package com.project.api.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class OptionGroupInput {

    @NotBlank
    @Size(max = 50)
    private String name;

    private int sortOrder;

    @Valid
    private List<OptionValueInput> values;
}
