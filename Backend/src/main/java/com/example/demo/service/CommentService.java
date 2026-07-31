package com.example.demo.service;

import com.example.demo.model.Comment;
import com.example.demo.model.Idea;
import com.example.demo.model.User;
import com.example.demo.repository.CommentRepository;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CommentService {

    private final CommentRepository repository;
    private final UserRepository userRepository;
    private final IdeaRepository ideaRepository; // <-- IdeaRepository inject kiya

    public CommentService(CommentRepository repository, UserRepository userRepository, IdeaRepository ideaRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.ideaRepository = ideaRepository;
    }

    public List<Comment> getAll() {
        return repository.findAll();
    }

    public Comment getById(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + id));
    }

    // Save method with Authentication and Idea mapping fixed
    public Comment save(Comment comment, Authentication authentication) {
        String email = authentication.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));

        comment.setUser(user);

        // Safe Idea mapping fix
        if (comment.getIdea() != null) {
            Long ideaId = comment.getIdea().getIdeaId(); // Agar aapke Idea model mein ID ka getter getIdeaId() hai
            if (ideaId != null) {
                Idea idea = ideaRepository.findById(ideaId)
                        .orElseThrow(() -> new RuntimeException("Idea not found with id: " + ideaId));
                comment.setIdea(idea);
            }
        }

        return repository.save(comment);
    }
    public Comment update(Long id, String newContent) {
        Comment comment = getById(id);
        comment.setContent(newContent);
        return repository.save(comment);
    }

    public void delete(Long id) {
        // Check if the comment actually exists before trying to delete
        if (repository.existsById(id)) {
            repository.deleteById(id);
        } else {
            throw new RuntimeException("Comment not found for deletion");
        }
    }
}