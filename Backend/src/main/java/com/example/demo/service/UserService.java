package com.example.demo.service;

import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository repository;

    @Autowired
    @Lazy
    private PasswordEncoder passwordEncoder;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = repository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        // DEBUGGING: Console mein check karne ke liye
        System.out.println("DEBUG: User found: " + user.getEmail());
        System.out.println("DEBUG: User Role from DB: " + user.getRole().name());
        System.out.println("DEBUG: Password Hash from DB: " + user.getPassword());

        // Spring Security 'ROLE_' prefix expect karta hai
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + user.getRole().name());

        return new org.springframework.security.core.userdetails.User(
                user.getEmail(),
                user.getPassword(),
                Collections.singletonList(authority)
        );
    }

    public User saveUser(User user) {
        if (user.getRole() == null) {
            user.setRole(Role.USER);
        }
        // Password hamesha encode ho kar hi save hoga
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return repository.save(user);
    }

    public List<User> getAllUsers() {
        return repository.findAll();
    }

    // Naya method jo Controller ke /role/{role} endpoint ke liye zaroori hai
    public List<User> getUsersByRole(String role) {
        try {
            Role enumRole = Role.valueOf(role.toUpperCase());
            return repository.findByRole(enumRole);
        } catch (IllegalArgumentException e) {
            return Collections.emptyList();
        }
    }

    public Optional<User> getUserById(long id) {
        return repository.findById(id);
    }

    public User updateUser(long id, User userDetails) {
        return repository.findById(id).map(existingUser -> {
            existingUser.setFullName(userDetails.getFullName());
            existingUser.setBio(userDetails.getBio());
            if (userDetails.getPassword() != null && !userDetails.getPassword().isEmpty()) {
                existingUser.setPassword(passwordEncoder.encode(userDetails.getPassword()));
            }
            existingUser.setRole(userDetails.getRole());
            return repository.save(existingUser);
        }).orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    public void deleteUser(long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
        } else {
            throw new RuntimeException("Cannot delete: User not found with id: " + id);
        }
    }
}