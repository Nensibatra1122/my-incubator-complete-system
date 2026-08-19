package com.example.demo.controller;

import com.example.demo.model.Investor;
import com.example.demo.service.InvestorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/investors")
@CrossOrigin(origins = "*")
public class InvestorController {

    @Autowired
    private InvestorService investorService;

    @GetMapping
    public ResponseEntity<List<Investor>> getAllInvestors() {
        List<Investor> investors = investorService.getAll();
        return ResponseEntity.ok(investors);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Investor> getInvestorById(@PathVariable Long id) {
        return investorService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/mentor/assigned-investors")
    public ResponseEntity<List<Investor>> getAssignedInvestorsForMentor(Authentication authentication) {
        List<Investor> investors = investorService.getInvestorsForAuthenticatedMentor(authentication);
        return ResponseEntity.ok(investors);
    }

    @PostMapping
    public ResponseEntity<Investor> createInvestor(@RequestBody Investor investor, Authentication authentication) {
        Investor savedInvestor = investorService.save(investor, authentication);
        return ResponseEntity.ok(savedInvestor);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Investor> updateInvestor(@PathVariable Long id, @RequestBody Investor investor, Authentication authentication) {
        investor.setInvestorId(id);
        Investor updatedInvestor = investorService.save(investor, authentication);
        return ResponseEntity.ok(updatedInvestor);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvestor(@PathVariable Long id) {
        investorService.delete(id);
        return ResponseEntity.ok().build();
    }
}