package com.example.demo.service;

import com.example.demo.model.Idea;
import com.example.demo.repository.IdeaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IdeaService {

    @Autowired
    private IdeaRepository ideaRepository;

    public List<Idea> getAllIdeas() {
        return ideaRepository.findAll();
    }

    public Optional<Idea> getIdeaById(Long id) {
        return ideaRepository.findById(id);
    }

    public Idea createIdea(Idea idea, Authentication auth) {
        // Fallback: Agar frontend ya session se email missing ho toh logged-in user ki email set kardein
        if ((idea.getCreatedByEmail() == null || idea.getCreatedByEmail().isEmpty()) && auth != null) {
            idea.setCreatedByEmail(auth.getName());
        }

        // Default status PENDING set karein agar pehle se set na ho
        if (idea.getStatus() == null || idea.getStatus().isEmpty()) {
            idea.setStatus("PENDING");
        }

        return ideaRepository.save(idea);
    }

    public Idea updateIdea(Idea idea) {
        return ideaRepository.save(idea);
    }
}