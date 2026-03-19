package com.project.api.service;

import com.project.api.domain.Member;
import com.project.api.repository.MemberRepository;
import com.project.api.security.JwtProvider;
import com.project.api.web.NotFoundException;
import com.project.api.web.dto.MemberResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final MemberRepository memberRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    /**
     * Returns JWT and member info on success. Throws on invalid credentials.
     */
    public LoginResult login(String email, String password) {
        Member member = memberRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Invalid email or password"));
        if (member.isDeleted()) {
            throw new IllegalArgumentException("Account has been withdrawn");
        }
        if (!passwordEncoder.matches(password, member.getPassword())) {
            throw new IllegalArgumentException("Invalid email or password");
        }
        String token = jwtProvider.createToken(member.getId(), member.getEmail());
        return new LoginResult(token, MemberResponse.from(member));
    }

    public Member findById(Long id) {
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Member not found: " + id));
        if (member.isDeleted()) {
            throw new NotFoundException("Member not found: " + id);
        }
        return member;
    }

    public record LoginResult(String token, MemberResponse member) {}
}
