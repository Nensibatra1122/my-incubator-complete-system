package com.example.demo.repository;

import com.example.demo.model.DiscussionMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DiscussionRepository extends JpaRepository<DiscussionMessage, Long> {

    // Fetch all messages for a specific project, ordered by newest first
    List<DiscussionMessage> findByProjectIdOrderByCreatedAtDesc(String projectId);

    // 💡 Updated to use LIKE so comma-separated multiple mentions are correctly searched
    @Query("SELECT dm FROM DiscussionMessage dm WHERE (dm.mentionedUserEmail = :email OR dm.mentionedUserEmail LIKE CONCAT('%', :email, '%')) AND dm.isRead = false")
    List<DiscussionMessage> findByMentionedUserEmailAndIsReadFalse(@Param("email") String email);
}