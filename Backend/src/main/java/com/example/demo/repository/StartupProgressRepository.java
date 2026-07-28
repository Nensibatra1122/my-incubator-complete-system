package com.example.demo.repository;

import com.example.demo.model.StartupProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StartupProgressRepository extends JpaRepository<StartupProgress, Long> {

    // Ab ye method ek List return karta hai, jisse 'Query did not return a unique result' wala error khatam ho jayega
    List<StartupProgress> findByStartupId(Long startupId);
}