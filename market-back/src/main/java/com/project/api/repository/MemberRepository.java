package com.project.api.repository;

import com.project.api.domain.Member;
import com.project.api.domain.MemberRole;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;

public interface MemberRepository extends JpaRepository<Member, Long> {

    Optional<Member> findByEmail(String email);

    Optional<Member> findByPasswordResetToken(String passwordResetToken);

    boolean existsByEmail(String email);

    boolean existsByRole(MemberRole role);

    long countByDeletedAtIsNull();

    long countByCreatedAtBetween(LocalDateTime from, LocalDateTime to);

    @Query("select m from Member m where (:includeDeleted = true or m.deletedAt is null) and (:kw is null or :kw = '' or lower(m.email) like lower(concat('%', :kw, '%')) or lower(m.name) like lower(concat('%', :kw, '%'))) order by m.createdAt desc")
    Page<Member> findAdminMembers(@Param("kw") String keyword, @Param("includeDeleted") boolean includeDeleted, Pageable pageable);

    Page<Member> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
