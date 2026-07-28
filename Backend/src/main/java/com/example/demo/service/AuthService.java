package com.example.demo.service;

import com.example.demo.dto.RegistrationDTO;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserService userService; // Hashing logic ab yahan se aayega

    public ResponseEntity<?> register(RegistrationDTO registrationDTO) {
        // 1. Email Check
        if (userRepository.findByEmail(registrationDTO.getEmail()).isPresent()) {
            return ResponseEntity.badRequest().body("Error: Email is already taken!");
        }

        // 2. Map DTO to User Entity
        User user = new User();
        user.setFullName(registrationDTO.getFullName());
        user.setEmail(registrationDTO.getEmail());
        user.setBio(registrationDTO.getBio());

        // Role setup
        if (registrationDTO.getRole() != null) {
            user.setRole(registrationDTO.getRole());
        } else {
            user.setRole(Role.USER);
        }

        // 3. Password set karna
        // Note: Raw password bhejein, UserService ka saveUser ise BCrypt encode kar dega
        user.setPassword(registrationDTO.getPassword());

        // 4. Save using UserService (Ye hashing handle karega)
        userService.saveUser(user);

        return ResponseEntity.ok("User registered successfully!");
    }
}