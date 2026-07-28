package com.example.demo.controller;

import com.example.demo.model.Comment;
import com.example.demo.service.CommentService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/comments")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public Comment addComment(@RequestBody Comment comment, Authentication authentication) {
        return commentService.save(comment, authentication);
    }

    @GetMapping
    public List<Comment> getAllComments() {
        return commentService.getAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Comment> getCommentById(@PathVariable Long id) {
        return ResponseEntity.ok(commentService.getById(id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCommentOwner(#id, authentication)")
    public ResponseEntity<Comment> updateComment(@PathVariable Long id, @RequestBody Comment commentDetails) {
        return ResponseEntity.ok(commentService.update(id, commentDetails.getContent()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isCommentOwner(#id, authentication)")
    public ResponseEntity<String> deleteComment(@PathVariable Long id) {
        commentService.delete(id);
        return ResponseEntity.ok("Comment deleted successfully!");
    }
}