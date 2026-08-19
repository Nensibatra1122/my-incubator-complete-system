package com.example.demo.service;

import com.example.demo.dto.RegistrationDTO;
import com.example.demo.model.Investor;
import com.example.demo.model.Mentor;
import com.example.demo.model.Role;
import com.example.demo.model.User;
import com.example.demo.repository.InvestorRepository;
import com.example.demo.repository.MentorRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvestorRepository investorRepository;

    @Autowired
    private MentorRepository mentorRepository;

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
        Role assignedRole;
        if (registrationDTO.getRole() != null) {
            assignedRole = registrationDTO.getRole();
            user.setRole(assignedRole);
        } else {
            assignedRole = Role.USER;
            user.setRole(assignedRole);
        }

        // 3. Password set karna
        user.setPassword(registrationDTO.getPassword());

        // 4. Save using UserService (Ye hashing handle karega aur saved user return karega ya fetch hoga)
        userService.saveUser(user);

        // Saved user ko dobara fetch karein taake generate hone wali primary key (userId) mil jaye
        User savedUser = userRepository.findByEmail(registrationDTO.getEmail()).orElse(user);

        // 5. Role ke mutabiq respective table mein automatic entry
        if (assignedRole == Role.INVESTOR) {
            Investor investor = new Investor();
            investor.setUser(savedUser);
            investorRepository.save(investor);
        }
        else if (assignedRole == Role.MENTOR) {
            Mentor mentor = new Mentor();
            mentor.setName(savedUser.getFullName());
            mentor.setEmail(savedUser.getEmail());
            mentor.setExpertise("General"); // Default value, baad mein profile se update ho sakti hai
            mentorRepository.save(mentor);
        }

        return ResponseEntity.ok(Map.of("message", "User registered successfully and mapped to role table!"));
    }
}