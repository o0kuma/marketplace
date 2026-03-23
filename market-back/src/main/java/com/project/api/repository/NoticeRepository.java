package com.project.api.repository;

import com.project.api.domain.Notice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface NoticeRepository extends JpaRepository<Notice, Long> {

    Page<Notice> findAllByOrderByPinnedDescCreatedAtDesc(Pageable pageable);

    @Query("""
            select n from Notice n
            where (:kw = '' or lower(n.title) like lower(concat('%', :kw, '%')))
              and (:pinned is null or n.pinned = :pinned)
            order by n.pinned desc, n.createdAt desc, n.id desc
            """)
    Page<Notice> search(@Param("kw") String keyword, @Param("pinned") Boolean pinned, Pageable pageable);

    @Query("""
            select n from Notice n
            where (n.pinned < :pinned)
               or (n.pinned = :pinned and n.createdAt < :createdAt)
               or (n.pinned = :pinned and n.createdAt = :createdAt and n.id < :id)
            order by n.pinned desc, n.createdAt desc, n.id desc
            """)
    List<Notice> findNext(
            @Param("pinned") boolean pinned,
            @Param("createdAt") LocalDateTime createdAt,
            @Param("id") Long id,
            Pageable pageable);

    @Query("""
            select n from Notice n
            where (n.pinned > :pinned)
               or (n.pinned = :pinned and n.createdAt > :createdAt)
               or (n.pinned = :pinned and n.createdAt = :createdAt and n.id > :id)
            order by n.pinned asc, n.createdAt asc, n.id asc
            """)
    List<Notice> findPrevious(
            @Param("pinned") boolean pinned,
            @Param("createdAt") LocalDateTime createdAt,
            @Param("id") Long id,
            Pageable pageable);
}
