package com.websentinel.auth.service;

import com.websentinel.auth.dto.AuthResponse;
import com.websentinel.auth.dto.LoginRequest;
import com.websentinel.auth.dto.RegisterRequest;
import com.websentinel.auth.entity.User;
import com.websentinel.auth.repository.UserRepository;
import com.websentinel.workspace.entity.Organization;
import com.websentinel.workspace.entity.OrganizationMember;
import com.websentinel.workspace.repository.OrganizationMemberRepository;
import com.websentinel.workspace.service.WorkspaceService;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final WorkspaceService workspaceService;
    private final OrganizationMemberRepository memberRepository;

    public AuthService(UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       WorkspaceService workspaceService,
                       OrganizationMemberRepository memberRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.workspaceService = workspaceService;
        this.memberRepository = memberRepository;
    }

    public AuthResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setEmail(req.getEmail());
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        user.setFullName(req.getFullName());
        userRepository.save(user);

        Organization org = workspaceService.createPersonalWorkspace(user);

        String token = jwtService.generateToken(user.getId(), org.getId(), "OWNER");

        AuthResponse res = new AuthResponse();
        res.setAccessToken(token);
        res.setUserId(user.getId());
        res.setOrganizationId(org.getId());
        return res;
    }

    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials"));

        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid credentials");
        }

        List<OrganizationMember> memberships = memberRepository.findByUserId(user.getId());
        if (memberships.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No workspace found for user");
        }
        OrganizationMember member = memberships.get(0);

        String token = jwtService.generateToken(user.getId(), member.getOrganizationId(), member.getRole());

        AuthResponse res = new AuthResponse();
        res.setAccessToken(token);
        res.setUserId(user.getId());
        res.setOrganizationId(member.getOrganizationId());
        return res;
    }
}