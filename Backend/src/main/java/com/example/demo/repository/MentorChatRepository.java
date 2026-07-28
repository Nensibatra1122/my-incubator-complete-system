package com.example.demo.repository;

import com.example.demo.model.MentorChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MentorChatRepository extends JpaRepository<MentorChatMessage, Long> {

    // Correct Spring Data JPA derived query method
    List<MentorChatMessage> findAllByOrderByCreatedAtAsc();

}