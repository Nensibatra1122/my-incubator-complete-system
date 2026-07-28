package com.example.demo.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "investors")
public class Investor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "investor_id")
    private Long investorId;

    @Column(name = "investment_focus")
    private String investmentFocus;

    @Column(name = "minimum_amount")
    private Double minimumAmount;

    @Column(name = "what_investor_offers")
    private String whatInvestorOffers;

    @OneToOne
    @JoinColumn(name = "user_id")
    private User user;

    // Direct Relationship with Incubation (Startups)
    @ManyToMany(fetch = FetchType.EAGER)
    @JoinTable(
            name = "investor_incubations",
            joinColumns = @JoinColumn(name = "investor_id"),
            inverseJoinColumns = @JoinColumn(name = "incubation_id")
    )
    private List<Incubation> incubations = new ArrayList<>();

    public Investor() {}

    public Long getInvestorId() {
        return investorId;
    }

    public void setInvestorId(Long investorId) {
        this.investorId = investorId;
    }

    public String getInvestmentFocus() {
        return investmentFocus;
    }

    public void setInvestmentFocus(String investmentFocus) {
        this.investmentFocus = investmentFocus;
    }

    public Double getMinimumAmount() {
        return minimumAmount;
    }

    public void setMinimumAmount(Double minimumAmount) {
        this.minimumAmount = minimumAmount;
    }

    public String getWhatInvestorOffers() {
        return whatInvestorOffers;
    }

    public void setWhatInvestorOffers(String whatInvestorOffers) {
        this.whatInvestorOffers = whatInvestorOffers;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<Incubation> getIncubations() {
        return incubations;
    }

    public void setIncubations(List<Incubation> incubations) {
        this.incubations = incubations;
    }

    // Helper method to keep code compatibility if projects list is referenced elsewhere
    public List<String> getProjects() {
        if (incubations == null) return new ArrayList<>();
        return incubations.stream()
                .map(Incubation::getProgramName)
                .collect(Collectors.toList());
    }

    public void setProjects(List<String> projectNames) {
        // Yeh sirf compatibility ke liye hai, real mapping incubations ke through hogi
    }

    // Fixed getEmail method mapping via User relation
    public String getEmail() {
        if (user != null) {
            return user.getEmail();
        }
        return null;
    }
}