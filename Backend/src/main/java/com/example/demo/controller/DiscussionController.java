package com.example.demo.controller;

import com.example.demo.model.DiscussionMessage;
import com.example.demo.service.DiscussionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/discussion")
@CrossOrigin(origins = "*")
public class DiscussionController {

    @Autowired
    private DiscussionService discussionService;

    // Endpoint to post a new message or comment to a project feed
    @PostMapping("/post")
    public ResponseEntity<DiscussionMessage> postMessage(@RequestBody DiscussionMessage message) {
        DiscussionMessage savedMessage = discussionService.postMessage(message);
        return ResponseEntity.ok(savedMessage);
    }

    // Endpoint to fetch all discussion messages for a specific project
    @GetMapping("/feed/{projectId}")
    public ResponseEntity<List<DiscussionMessage>> getFeed(@PathVariable String projectId) {
        List<DiscussionMessage> messages = discussionService.getProjectFeed(projectId);
        return ResponseEntity.ok(messages);
    }

    // Endpoint to get unread mentions for a user
    @GetMapping("/mentions")
    public ResponseEntity<List<DiscussionMessage>> getUnreadMentions(@RequestParam String email) {
        List<DiscussionMessage> mentions = discussionService.getUnreadMentions(email);
        return ResponseEntity.ok(mentions);
    }

    // Endpoint to mark a notification/mention as read (Updates isRead to true without deleting the record)
    @PutMapping("/read/{id}")
    public ResponseEntity<Void> markAsRead(@PathVariable Long id) {
        discussionService.markAsRead(id);
        return ResponseEntity.ok().build();
    }
}