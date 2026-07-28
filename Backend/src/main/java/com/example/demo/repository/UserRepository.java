package com.example.demo.repository;

import com.example.demo.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional; // Yeh import zaroori hai

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    // Sirf yeh ek method rakhein
    Optional<User> findByEmail(String email);

}