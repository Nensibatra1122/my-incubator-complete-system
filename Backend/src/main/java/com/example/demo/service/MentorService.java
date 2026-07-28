package com.example.demo.service;

import com.example.demo.dto.MentorDTO;
import com.example.demo.model.ActivityLog;
import com.example.demo.model.Investor;
import com.example.demo.model.Mentor;
import com.example.demo.model.User;
import com.example.demo.repository.ActivityLogRepository;
import com.example.demo.repository.IncubationRepository;
import com.example.demo.repository.InvestorRepository;
import com.example.demo.repository.MentorRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class MentorService {

    @Autowired
    private MentorRepository repository;

    @Autowired
    private IncubationRepository incubationRepository;

    @Autowired
    private ActivityLogRepository logRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InvestorRepository investorRepository;

    public List<Mentor> getAll() {
        return repository.findAll();
    }

    public Mentor save(Mentor entity, Authentication auth) {
        Mentor savedMentor = repository.save(entity);

        String email = (auth != null && auth.getName() != null)
                ? auth.getName()
                : "System";

        try {
            ActivityLog log = new ActivityLog();
            log.setAction("SAVE_MENTOR");
            log.setDescription("Mentor record saved/updated successfully.");
            log.setCreatedByEmail(email);
            log.setTimestamp(LocalDateTime.now());

            User user = userRepository.findByEmail(email).orElse(null);
            if (user != null) {
                log.setUser(user);
            }

            logRepository.save(log);
        } catch (Exception e) {
            // Ignore logging errors
        }

        return savedMentor;
    }

    public void delete(Long id) {
        if (repository.existsById(id)) {
            repository.deleteById(id);
        } else {
            throw new RuntimeException("Mentor not found with id: " + id);
        }
    }

    public List<MentorDTO> getAllMentorsWithStartups(Authentication auth) {
        List<Mentor> mentors = repository.findAll();

        boolean isInvestor = false;
        boolean isMentor = false;
        String currentUserEmail = "";

        if (auth != null) {
            currentUserEmail = auth.getName().toLowerCase();
            isInvestor = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().contains("INVESTOR"));
            isMentor = auth.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().contains("MENTOR"));
        }

        // Agar user ek Mentor hai, toh use sirf apni profile nazar aayegi
        if (isMentor && !isInvestor) {
            List<MentorDTO> mentorList = new ArrayList<>();
            for (Mentor mentor : mentors) {
                if (mentor.getEmail() != null && mentor.getEmail().toLowerCase().equals(currentUserEmail)) {
                    MentorDTO dto = new MentorDTO();
                    dto.setMentorId(mentor.getMentorId());
                    dto.setName(mentor.getName());
                    dto.setExpertise(mentor.getExpertise());
                    dto.setBio(mentor.getBio());

                    String startupDisplay = "Not Assigned";
                    try {
                        List<String> startupNames = incubationRepository.findStartupNamesByMentorId(mentor.getMentorId());
                        if (startupNames != null && !startupNames.isEmpty()) {
                            startupDisplay = String.join(", ", startupNames);
                        }
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                    dto.setAssignedStartup(startupDisplay);
                    mentorList.add(dto);
                }
            }
            return mentorList;
        }

        List<String> targetProjectNames = new ArrayList<>();
        if (isInvestor) {
            try {
                List<Investor> allInvestors = investorRepository.findAll();
                for (Investor inv : allInvestors) {
                    if (inv.getProjects() != null) {
                        targetProjectNames.addAll(inv.getProjects());
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        final List<String> finalTargetProjects = targetProjectNames.stream()
                .map(p -> p == null ? "" : p.trim().toLowerCase())
                .collect(Collectors.toList());

        List<MentorDTO> allMentors = new ArrayList<>();
        for (Mentor mentor : mentors) {
            MentorDTO dto = new MentorDTO();
            dto.setMentorId(mentor.getMentorId());
            dto.setName(mentor.getName());
            dto.setExpertise(mentor.getExpertise());
            dto.setBio(mentor.getBio());

            String startupDisplay = "Not Assigned";
            try {
                List<String> startupNames = incubationRepository.findStartupNamesByMentorId(mentor.getMentorId());
                if (startupNames != null && !startupNames.isEmpty()) {
                    startupDisplay = String.join(", ", startupNames);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            dto.setAssignedStartup(startupDisplay);
            allMentors.add(dto);
        }

        if (isInvestor) {
            if (finalTargetProjects.isEmpty()) {
                return new ArrayList<>();
            }

            List<MentorDTO> filteredInvestorsMentors = new ArrayList<>();
            for (MentorDTO dto : allMentors) {
                if (dto.getAssignedStartup() != null && !dto.getAssignedStartup().equals("Not Assigned")) {
                    String[] assignedList = dto.getAssignedStartup().split(",");
                    for (String startup : assignedList) {
                        if (finalTargetProjects.contains(startup.trim().toLowerCase())) {
                            filteredInvestorsMentors.add(dto);
                            break;
                        }
                    }
                }
            }
            return filteredInvestorsMentors;
        }

        return allMentors;
    }
}