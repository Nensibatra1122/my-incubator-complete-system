package com.example.demo.service;

import com.example.demo.dto.InvestorInterestRequestDTO;
import com.example.demo.dto.InvestorInterestResponseDTO;
import com.example.demo.model.Idea;
import com.example.demo.model.InvestorInterest;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.InvestorInterestRepository;
import com.example.demo.repository.InvestorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.stream.Collectors;

@Service
public class InvestorInterestService {

    @Autowired
    private InvestorInterestRepository investorInterestRepository;

    @Autowired
    private IdeaRepository ideaRepository;

    @Autowired
    private InvestorRepository investorRepository;

    public InvestorInterest createInterest(InvestorInterestRequestDTO request) {
        if (request.getIdeaId() == null) {
            throw new IllegalArgumentException("ideaId is required.");
        }

        Idea idea = ideaRepository.findById(request.getIdeaId())
                .orElseThrow(() -> new NoSuchElementException("Idea not found with id: " + request.getIdeaId()));

        InvestorInterest interest = new InvestorInterest();
        interest.setIdea(idea);
        interest.setInvestorEmail(request.getInvestorEmail());
        interest.setStatus("PENDING_APPROVAL");

        if (request.getInvestorId() != null) {
            investorRepository.findById(request.getInvestorId())
                    .ifPresent(interest::setInvestor);
        }

        return investorInterestRepository.save(interest);
    }

    public InvestorInterestResponseDTO createInterestDTO(InvestorInterestRequestDTO request) {
        InvestorInterest saved = createInterest(request);
        return convertToDTO(saved);
    }

    public List<InvestorInterestResponseDTO> getAllInterestDTOs() {
        return investorInterestRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<InvestorInterestResponseDTO> getPendingInterestDTOs() {
        return investorInterestRepository.findByStatus("PENDING_APPROVAL").stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    public List<InvestorInterestResponseDTO> getInterestDTOsByInvestorEmail(String email) {
        return investorInterestRepository.findByInvestorEmailIgnoreCase(email).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    private InvestorInterestResponseDTO convertToDTO(InvestorInterest interest) {
        InvestorInterestResponseDTO dto = new InvestorInterestResponseDTO();
        dto.setId(interest.getId());
        dto.setStatus(interest.getStatus());
        dto.setInvestorEmail(interest.getInvestorEmail());

        if (interest.getCreatedAt() != null) {
            dto.setCreatedAt(interest.getCreatedAt().toString());
        }

        if (interest.getInvestor() != null) {
            dto.setInvestorId(interest.getInvestor().getInvestorId());
        }

        if (interest.getIdea() != null) {
            dto.setIncubationId(interest.getIdea().getId());
            dto.setStartupName(interest.getIdea().getTitle());
        }

        return dto;
    }

    public InvestorInterest updateStatus(Long interestId, String newStatus) {
        InvestorInterest interest = investorInterestRepository.findById(interestId)
                .orElseThrow(() -> new NoSuchElementException("Interest not found with id: " + interestId));
        interest.setStatus(newStatus);
        return investorInterestRepository.save(interest);
    }

    public InvestorInterestResponseDTO updateStatusDTO(Long interestId, String newStatus) {
        InvestorInterest updated = updateStatus(interestId, newStatus);
        return convertToDTO(updated);
    }
}