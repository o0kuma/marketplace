package com.project.api.web;

import com.project.api.service.NoticeService;
import com.project.api.web.dto.NoticeListItemResponse;
import com.project.api.web.dto.NoticeRequest;
import com.project.api.web.dto.NoticeResponse;
import com.project.api.web.dto.PageResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/notices")
@RequiredArgsConstructor
public class AdminNoticeController {

    private final NoticeService noticeService;

    @GetMapping
    public PageResponse<NoticeListItemResponse> list(@PageableDefault(size = 20) Pageable pageable) {
        return PageResponse.of(noticeService.listAdmin(pageable));
    }

    @GetMapping("/{id}")
    public NoticeResponse get(@PathVariable Long id) {
        return noticeService.getAdmin(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NoticeResponse create(@Valid @RequestBody NoticeRequest request) {
        return noticeService.create(request);
    }

    @PatchMapping("/{id}")
    public NoticeResponse update(@PathVariable Long id, @Valid @RequestBody NoticeRequest request) {
        return noticeService.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        noticeService.delete(id);
    }
}
