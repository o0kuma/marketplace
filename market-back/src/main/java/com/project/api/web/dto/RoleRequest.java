package com.project.api.web.dto;

import com.project.api.domain.MemberRole;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class RoleRequest {

    private MemberRole role;
}
