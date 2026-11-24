package com.websentinel.auth.service;

import com.websentinel.auth.dto.UserResponse;
import com.websentinel.auth.entity.User;
import com.websentinel.auth.repository.UserRepository;
import com.websentinel.common.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
public class UserService {

    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public UserResponse getById(UUID id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("User not found: " + id));
        return toResponse(user);
    }

    private UserResponse toResponse(User user) {
        UserResponse r = new UserResponse();
        r.setId(user.getId());
        r.setEmail(user.getEmail());
        r.setFullName(user.getFullName());
        r.setEmailVerified(user.isEmailVerified());
        r.setCreatedAt(user.getCreatedAt());
        return r;
    }
}