package com.example.demo.controller;

import com.example.demo.model.Investor;
import com.example.demo.service.InvestorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/investors")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class InvestorController {

    @Autowired
    private InvestorService investorService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public Investor createInvestor(@RequestBody Investor investor, Authentication authentication) {
        return investorService.save(investor, authentication);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR')")
    public List<Investor> getAllInvestors(Authentication authentication) {
        List<Investor> allInvestors = investorService.getAll();

        if (authentication == null) {
            return List.of();
        }

        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("ADMIN"));

        if (isAdmin) {
            return allInvestors;
        }

        boolean isMentor = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("MENTOR"));

        boolean isStudentOrUser = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("STUDENT") || a.getAuthority().contains("USER"));

        // Agar user Mentor ya sirf basic Student/User hai, toh investors directory khali return hogi
        if (isMentor || isStudentOrUser) {
            return List.of();
        }

        boolean isInvestorRole = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().contains("INVESTOR"));

        if (isInvestorRole) {
            String loggedInUser = authentication.getName();
            return allInvestors.stream()
                    .filter(inv -> inv.toString().contains(loggedInUser))
                    .collect(Collectors.toList());
        }

        return allInvestors;
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'STUDENT', 'MENTOR', 'INVESTOR')")
    public ResponseEntity<Investor> getInvestorById(@PathVariable Long id) {
        return investorService.getById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or @securityService.isInvestorOwner(#id, authentication)")
    public ResponseEntity<Investor> updateInvestor(@PathVariable Long id, @RequestBody Investor investorDetails, Authentication authentication) {
        return investorService.getById(id).map(investor -> {
            investor.setInvestmentFocus(investorDetails.getInvestmentFocus());
            investor.setMinimumAmount(investorDetails.getMinimumAmount());
            investor.setWhatInvestorOffers(investorDetails.getWhatInvestorOffers());
            investor.setProjects(investorDetails.getProjects());

            Investor updatedInvestor = investorService.save(investor, authentication);
            return ResponseEntity.ok(updatedInvestor);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteInvestor(@PathVariable Long id) {
        if (investorService.getById(id).isPresent()) {
            investorService.delete(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}