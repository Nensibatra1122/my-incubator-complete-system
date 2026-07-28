package com.example.demo.controller;

import com.example.demo.dto.RegistrationDTO;
import com.example.demo.model.LoginRequest;
import com.example.demo.model.User;
import com.example.demo.service.AuthService;
import com.example.demo.service.UserService;
import com.example.demo.util.JwtUtil;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    @Autowired private UserService userService;
    @Autowired private AuthService authService;
    @Autowired private JwtUtil jwtUtil;
    @Autowired private AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegistrationDTO registrationDTO) {
        return authService.register(registrationDTO);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        System.out.println("Login attempt for: " + loginRequest.getEmail());

        try {
            // 1. Authenticate
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(loginRequest.getEmail(), loginRequest.getPassword())
            );

            if (authentication.isAuthenticated()) {
                // 2. Fetch User Role
                String userRole = authentication.getAuthorities().stream()
                        .map(GrantedAuthority::getAuthority)
                        .findFirst()
                        .orElse("");

                // 3. Match Role
                if (!userRole.toUpperCase().contains(loginRequest.getRole().toUpperCase())) {
                    System.err.println("ROLE MISMATCH: Expected " + loginRequest.getRole() + " but got " + userRole);
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("message", "Role mismatch!"));
                }

                // 4. Generate Token
                String token = jwtUtil.generateToken(loginRequest.getEmail(), userRole);
                return ResponseEntity.ok(Map.of("token", token, "role", userRole));
            }
        } catch (Exception e) {
            // ASLI ERROR CONSOLE MEIN DIKHAYEGA
            System.err.println("AUTHENTICATION ERROR: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Invalid email or password!"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("message", "Authentication Failed!"));
    }

    @GetMapping("/users")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @PutMapping("/update/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> updateUser(@PathVariable Long id, @RequestBody User userDetails) {
        userService.updateUser(id, userDetails);
        return ResponseEntity.ok("User updated successfully!");
    }

    @DeleteMapping("/delete/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<String> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
        return ResponseEntity.ok("User deleted successfully!");
    }
}