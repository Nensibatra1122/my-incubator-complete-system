package com.example.demo.service;

import com.example.demo.model.MentorQuery;
import com.example.demo.repository.MentorQueryRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class MentorQueryService {

    @Autowired
    private MentorQueryRepository queryRepository;

    // 1. Nayi query create karne ke liye
    public MentorQuery createQuery(String question, String studentEmail) {
        MentorQuery query = new MentorQuery(question, studentEmail);
        return queryRepository.save(query);
    }

    // 2. Sabhi broadcasted queries fetch karne ke liye (Public Feed)
    public List<MentorQuery> getBroadcastedQueries() {
        return queryRepository.findByIsBroadcastTrueOrderByAnsweredAtDesc();
    }

    // 3. Mentors ke liye pending queries fetch karne ke liye
    public List<MentorQuery> getPendingQueries() {
        return queryRepository.findByAnswerIsNull();
    }

    // 4. Mentor ka answer save karke broadcast true karne ke liye
    public MentorQuery answerQuery(Long id, String answer, String mentorEmail) {
        MentorQuery query = queryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Query not found with id: " + id));

        query.setAnswer(answer);
        query.setMentorEmail(mentorEmail);
        query.setAnsweredAt(LocalDateTime.now());
        query.setBroadcast(true);

        return queryRepository.save(query);
    }
}