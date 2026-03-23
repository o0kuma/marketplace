package com.project.api.service;

import com.project.api.domain.Notice;
import com.project.api.repository.NoticeRepository;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.NoticeListItemResponse;
import com.project.api.web.dto.NoticeRequest;
import com.project.api.web.dto.NoticeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public Page<NoticeListItemResponse> listPublic(String keyword, Boolean pinned, Pageable pageable) {
        String kw = keyword == null ? "" : keyword.trim();
        return noticeRepository.search(kw, pinned, pageable)
                .map(NoticeListItemResponse::from);
    }

    public NoticeResponse getPublic(Long id) {
        Notice n = noticeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notice not found: " + id));
        return NoticeResponse.from(n, toNavItem(previousOf(n)), toNavItem(nextOf(n)));
    }

    public Page<NoticeListItemResponse> listAdmin(String keyword, Boolean pinned, Pageable pageable) {
        String kw = keyword == null ? "" : keyword.trim();
        return noticeRepository.search(kw, pinned, pageable)
                .map(NoticeListItemResponse::from);
    }

    public NoticeResponse getAdmin(Long id) {
        return getPublic(id);
    }

    @Transactional
    public NoticeResponse create(NoticeRequest request) {
        Notice n = Notice.builder()
                .title(request.getTitle().trim())
                .content(request.getContent())
                .pinned(request.isPinned())
                .build();
        return NoticeResponse.from(noticeRepository.save(n));
    }

    @Transactional
    public NoticeResponse update(Long id, NoticeRequest request) {
        Notice n = noticeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notice not found: " + id));
        n.update(request.getTitle().trim(), request.getContent(), request.isPinned());
        return NoticeResponse.from(n);
    }

    @Transactional
    public void delete(Long id) {
        if (!noticeRepository.existsById(id)) {
            throw new NotFoundException("Notice not found: " + id);
        }
        noticeRepository.deleteById(id);
    }

    private Notice previousOf(Notice current) {
        return noticeRepository.findPrevious(
                current.isPinned(),
                current.getCreatedAt(),
                current.getId(),
                PageRequest.of(0, 1)
        ).stream().findFirst().orElse(null);
    }

    private Notice nextOf(Notice current) {
        return noticeRepository.findNext(
                current.isPinned(),
                current.getCreatedAt(),
                current.getId(),
                PageRequest.of(0, 1)
        ).stream().findFirst().orElse(null);
    }

    private NoticeResponse.NoticeNavItem toNavItem(Notice n) {
        if (n == null) return null;
        return NoticeResponse.NoticeNavItem.builder()
                .id(n.getId())
                .title(n.getTitle())
                .build();
    }
}
