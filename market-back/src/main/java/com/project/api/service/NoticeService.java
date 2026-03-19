package com.project.api.service;

import com.project.api.domain.Notice;
import com.project.api.repository.NoticeRepository;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.NoticeListItemResponse;
import com.project.api.web.dto.NoticeRequest;
import com.project.api.web.dto.NoticeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class NoticeService {

    private final NoticeRepository noticeRepository;

    public Page<NoticeListItemResponse> listPublic(Pageable pageable) {
        return noticeRepository.findAllByOrderByPinnedDescCreatedAtDesc(pageable)
                .map(NoticeListItemResponse::from);
    }

    public NoticeResponse getPublic(Long id) {
        Notice n = noticeRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Notice not found: " + id));
        return NoticeResponse.from(n);
    }

    public Page<NoticeListItemResponse> listAdmin(Pageable pageable) {
        return noticeRepository.findAllByOrderByPinnedDescCreatedAtDesc(pageable)
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
}
