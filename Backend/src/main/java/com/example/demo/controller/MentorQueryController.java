package com.example.demo.controller;

import com.example.demo.model.MentorQuery;
import com.example.demo.repository.MentorQueryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/queries")
@CrossOrigin(origins = "*")
public class MentorQueryController {

    @Autowired
    private MentorQueryRepository queryRepository;

    // 1. Student / User query submit karega
    @PostMapping
    public ResponseEntity<MentorQuery> submitQuery(@RequestBody MentorQuery queryRequest, @RequestParam String email) {
        MentorQuery query = new MentorQuery(queryRequest.getQuestion(), email);
        MentorQuery savedQuery = queryRepository.save(query);
        return ResponseEntity.ok(savedQuery);
    }

    // 2. Sabhi broadcasted queries fetch karne ke liye (Sare users ke liye public feed)
    @GetMapping("/broadcasted")
    public ResponseEntity<List<MentorQuery>> getBroadcastedQueries() {
        List<MentorQuery> queries = queryRepository.findByIsBroadcastTrueOrderByAnsweredAtDesc();
        return ResponseEntity.ok(queries);
    }

    // 3. Mentors ke liye pending queries dekhne ke liye jinka jawab dena baqi hai
    @GetMapping("/pending")
    public ResponseEntity<List<MentorQuery>> getPendingQueries() {
        List<MentorQuery> queries = queryRepository.findByAnswerIsNull();
        return ResponseEntity.ok(queries);
    }

    // 4. Mentor query ka answer dega aur broadcast toggle karega
    @PutMapping("/{id}/answer")
    public ResponseEntity<MentorQuery> answerQuery(
            @PathVariable Long id,
            @RequestBody MentorQuery answerRequest,
            @RequestParam String mentorEmail) {

        MentorQuery query = queryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Query not found with id: " + id));

        query.setAnswer(answerRequest.getAnswer());
        query.setMentorEmail(mentorEmail);
        query.setAnsweredAt(LocalDateTime.now());
        query.setBroadcast(true); // Answer dete hi broadcast true ho jaye ga taake sab ko dikhe

        MentorQuery updatedQuery = queryRepository.save(query);
        return ResponseEntity.ok(updatedQuery);
    }
}