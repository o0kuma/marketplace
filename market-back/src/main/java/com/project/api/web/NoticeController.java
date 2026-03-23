package com.project.api.web;

import com.project.api.service.NoticeService;
import com.project.api.web.dto.NoticeListItemResponse;
import com.project.api.web.dto.NoticeResponse;
import com.project.api.web.dto.PageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notices")
@RequiredArgsConstructor
public class NoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public PageResponse<NoticeListItemResponse> list(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Boolean pinned,
            @PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(noticeService.listPublic(keyword, pinned, pageable));
    }

    @GetMapping("/{id}")
    public NoticeResponse get(@PathVariable Long id) {
        return noticeService.getPublic(id);
    }
}
