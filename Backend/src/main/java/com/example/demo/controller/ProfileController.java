package com.example.demo.controller;

import com.example.demo.model.Profile;
import com.example.demo.repository.ProfileRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/profiles")
public class ProfileController {

    @Autowired
    private ProfileRepository profileRepository;

    @Autowired
    private UserRepository userRepository;

    // CREATE OR UPDATE (Upsert): Logged-in user ke sath profile create ya update karna
    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Profile> createOrUpdateProfile(@RequestBody Profile profileDetails, Authentication authentication) {
        String email = authentication.getName();
        return userRepository.findByEmail(email).map(user -> {
            Profile existingProfile = profileRepository.findAll().stream()
                    .filter(p -> p.getUser() != null && p.getUser().getId().equals(user.getId()))
                    .findFirst()
                    .orElse(null);

            if (existingProfile != null) {
                existingProfile.setFullName(profileDetails.getFullName());
                existingProfile.setBio(profileDetails.getBio());
                existingProfile.setLinkedInUrl(profileDetails.getLinkedInUrl());
                existingProfile.setGithubUrl(profileDetails.getGithubUrl());
                existingProfile.setProfilePictureUrl(profileDetails.getProfilePictureUrl());
                existingProfile.setSkills(profileDetails.getSkills());
                existingProfile.setUser(user);
                return ResponseEntity.ok(profileRepository.save(existingProfile));
            } else {
                profileDetails.setUser(user);
                Profile saved = profileRepository.save(profileDetails);
                return ResponseEntity.ok(saved);
            }
        }).orElse(ResponseEntity.badRequest().build());
    }

    // READ ALL: Admin saare profiles dekh sake
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<Profile> getAllProfiles() {
        return profileRepository.findAll();
    }

    // GET CURRENT USER PROFILE: Logged-in user ki apni profile fetch karne ke liye
    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<Profile> getCurrentProfile(Authentication authentication) {
        String email = authentication.getName();
        return profileRepository.findAll().stream()
                .filter(p -> p.getUser() != null && p.getUser().getEmail().equals(email))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.ok(new Profile()));
    }

    // UPDATE: Specific ID wali profile update karna
    @PutMapping("/{id}")
    @PreAuthorize("@securityService.isProfileOwner(#id, authentication)")
    public ResponseEntity<Profile> updateProfile(@PathVariable Long id, @RequestBody Profile profileDetails, Authentication authentication) {
        String email = authentication.getName();
        return profileRepository.findById(id).map(profile -> {
            profile.setFullName(profileDetails.getFullName());
            profile.setBio(profileDetails.getBio());
            profile.setLinkedInUrl(profileDetails.getLinkedInUrl());
            profile.setGithubUrl(profileDetails.getGithubUrl());
            profile.setProfilePictureUrl(profileDetails.getProfilePictureUrl());
            profile.setSkills(profileDetails.getSkills());

            userRepository.findByEmail(email).ifPresent(profile::setUser);

            return ResponseEntity.ok(profileRepository.save(profile));
        }).orElse(ResponseEntity.notFound().build());
    }
}