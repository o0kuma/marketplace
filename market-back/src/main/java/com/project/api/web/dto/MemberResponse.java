package com.project.api.web.dto;

import com.project.api.domain.Member;
import com.project.api.domain.MemberRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MemberResponse {

    private Long id;
    private String name;
    private String email;
    private String phone;
    private String address;
    private MemberRole role;
    private Boolean deleted;
    private String profileImageUrl;

    public static MemberResponse from(Member member) {
        return MemberResponse.builder()
                .id(member.getId())
                .name(member.getName())
                .email(member.getEmail())
                .phone(member.getPhone())
                .address(member.getAddress())
                .role(member.getRole())
                .deleted(member.isDeleted())
                .profileImageUrl(member.getProfileImageUrl())
                .build();
    }
}
