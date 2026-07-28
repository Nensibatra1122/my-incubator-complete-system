package com.example.demo.repository;

import com.example.demo.model.Idea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IdeaRepository extends JpaRepository<Idea, Long> {
    List<Idea> findByCreatedByEmail(String email);
}