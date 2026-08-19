package com.example.demo.controller;

import com.example.demo.dto.MentorDTO;
import com.example.demo.service.MentorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/mentors", "/mentors"})
@CrossOrigin(origins = {"http://localhost:5173", "http://98.94.6.13"}, allowCredentials = "true")
public class MentorController {

    @Autowired
    private MentorService mentorService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR', 'USER')")
    public ResponseEntity<List<MentorDTO>> getAllMentors(Authentication authentication) {
        List<MentorDTO> mentors = mentorService.getAllMentorsWithStartups(authentication);
        return ResponseEntity.ok(mentors);
    }
}