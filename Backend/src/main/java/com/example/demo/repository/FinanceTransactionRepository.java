package com.example.demo.repository;
import com.example.demo.model.FinanceTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository

public interface FinanceTransactionRepository extends JpaRepository<FinanceTransaction, Long> {

    // Purana method
    List<FinanceTransaction> findByFinanceProjectId(Long projectId);

    // Naya method (Jo aapke Controller ke liye zaroori hai)
    List<FinanceTransaction> findByFinanceProject_IdAndType(Long projectId, String type);
}

