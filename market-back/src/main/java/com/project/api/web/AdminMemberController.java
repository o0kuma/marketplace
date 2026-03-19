package com.project.api.web;

import com.project.api.service.MemberService;
import com.project.api.web.dto.MemberResponse;
import com.project.api.web.dto.PageResponse;
import com.project.api.web.dto.RoleRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/members")
@RequiredArgsConstructor
public class AdminMemberController {

    private final MemberService memberService;

    @GetMapping
    public PageResponse<MemberResponse> list(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "false") boolean includeDeleted) {
        Pageable pageable = PageRequest.of(page, size);
        return PageResponse.of(memberService.listForAdmin(keyword, includeDeleted, pageable));
    }

    @PatchMapping("/{id}/role")
    public MemberResponse updateRole(@PathVariable Long id, @Valid @RequestBody RoleRequest request) {
        if (request.getRole() == null) {
            throw new IllegalArgumentException("role is required");
        }
        return memberService.updateRole(id, request.getRole());
    }

    @PatchMapping("/{id}/restore")
    public MemberResponse restore(@PathVariable Long id) {
        return memberService.restore(id);
    }
}
