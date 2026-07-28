package com.example.demo.repository;

import com.example.demo.model.FinanceProject;
import com.example.demo.dto.ProjectExpenseDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface FinanceProjectRepository extends JpaRepository<FinanceProject, Long> {

    @Query("SELECT new com.example.demo.dto.ProjectExpenseDTO(p.title, COALESCE(SUM(e.amount), 0.0), 'Success') " +
            "FROM FinanceTransaction e RIGHT JOIN e.financeProject p GROUP BY p.id, p.title")
    List<ProjectExpenseDTO> findAllProjectsExpenses();

    @Query("SELECT COALESCE(SUM(e.amount), 0.0) FROM FinanceTransaction e WHERE e.financeProject.id = :projectId")
    Double findTotalExpenseByProjectId(@Param("projectId") Long projectId);
}