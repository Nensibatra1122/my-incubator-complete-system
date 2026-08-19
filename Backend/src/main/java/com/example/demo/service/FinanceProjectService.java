package com.example.demo.service;

import com.example.demo.dto.ProjectExpenseDTO;
import com.example.demo.model.FinanceProject;
import com.example.demo.repository.FinanceProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import java.util.List;
import java.util.Optional;

@Service
public class FinanceProjectService {

    @Autowired
    private FinanceProjectRepository repository;

    // 1. All Projects Expenses (Analytics with Investor check)
    public List<ProjectExpenseDTO> getAllProjectsExpenses(Authentication authentication) {
        boolean isInvestor = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("INVESTOR"));

        if (isInvestor) {
            return List.of();
        }

        return repository.findAllProjectsExpenses();
    }

    // Overloaded method to prevent breaking existing calls
    public List<ProjectExpenseDTO> getAllProjectsExpenses() {
        return repository.findAllProjectsExpenses();
    }

    // 2. Create / Save
    public FinanceProject save(FinanceProject project) {
        return repository.save(project);
    }

    // 3. Find All (With Investor check)
    public List<FinanceProject> findAll(Authentication authentication) {
        boolean isInvestor = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("INVESTOR"));

        if (isInvestor) {
            return List.of();
        }

        return repository.findAll();
    }

    // Overloaded method
    public List<FinanceProject> findAll() {
        return repository.findAll();
    }

    // 4. Find By ID
    public Optional<FinanceProject> findById(Long id) {
        return repository.findById(id);
    }

    // 5. Update
    public ResponseEntity<FinanceProject> update(Long id, FinanceProject details) {
        return repository.findById(id).map(p -> {
            p.setTitle(details.getTitle());
            p.setBudget(details.getBudget());
            return ResponseEntity.ok(repository.save(p));
        }).orElse(ResponseEntity.notFound().build());
    }

    // 6. Delete
    public void delete(Long id) {
        repository.deleteById(id);
    }

    // 7. Total Expense for single project using optimized query
    public ProjectExpenseDTO getExpenseByProjectId(Long id) {
        FinanceProject project = repository.findById(id)
                .orElseGet(() -> {
                    FinanceProject newProj = new FinanceProject();
                    newProj.setId(id);
                    newProj.setTitle("Startup #" + id);
                    newProj.setBudget(120000.0);
                    return repository.save(newProj);
                });

        Double total = repository.findTotalExpenseByProjectId(id);
        if (total == null) total = 0.0;

        return new ProjectExpenseDTO(project.getTitle(), total, "Expense details for " + project.getTitle());
    }
}