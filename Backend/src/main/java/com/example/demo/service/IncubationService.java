package com.example.demo.service;

import com.example.demo.model.FinanceProject;
import com.example.demo.model.Idea;
import com.example.demo.model.Incubation;
import com.example.demo.model.IncubationTimelineLog;
import com.example.demo.model.Notification;
import com.example.demo.model.User;
import com.example.demo.repository.FinanceProjectRepository;
import com.example.demo.repository.IdeaRepository;
import com.example.demo.repository.IncubationRepository;
import com.example.demo.repository.IncubationTimelineLogRepository;
import com.example.demo.repository.MentorRepository;
import com.example.demo.repository.InvestorRepository;
import com.example.demo.repository.NotificationRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class IncubationService {

    @Autowired
    private IncubationRepository incubationRepository;

    @Autowired
    private IdeaRepository ideaRepository;

    @Autowired
    private FinanceProjectRepository financeProjectRepository;

    @Autowired
    private IncubationTimelineLogRepository timelineLogRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired(required = false)
    private UserRepository userRepository;

    @Autowired(required = false)
    private MentorRepository mentorRepository;

    @Autowired(required = false)
    private InvestorRepository investorRepository;

    @Transactional
    public Incubation incubationRepositorySaveWithFinance(Incubation incubation, Authentication auth) {
        Incubation saved = incubationRepository.save(incubation);

        boolean financeExists = financeProjectRepository.existsByStartupId(saved.getId());
        if (!financeExists) {
            FinanceProject financeProject = new FinanceProject();
            financeProject.setStartupId(saved.getId());
            financeProject.setTitle(saved.getProgramName() != null ? saved.getProgramName() : "Startup #" + saved.getId());

            double initialBudget = 0.0;
            if (saved.getFunding() != null) {
                initialBudget = saved.getFunding();
            }
            financeProject.setBudget(initialBudget);

            String email = (auth != null && auth.getName() != null) ? auth.getName() : "System";
            financeProject.setCreatedByEmail(email);

            if (saved.getMentor() != null) {
                financeProject.setMentorEmail(saved.getMentor().getEmail());
            }

            financeProjectRepository.save(financeProject);
        }

        return saved;
    }

    @Transactional
    public Incubation acceptAndAssignIdea(Long ideaId, Long mentorId, Long investorId) {
        Idea idea = ideaRepository.findById(ideaId)
                .orElseThrow(() -> new RuntimeException("Idea not found with id: " + ideaId));

        idea.setStatus("ACCEPTED");
        ideaRepository.save(idea);

        Incubation incubation = incubationRepository.findAll().stream()
                .filter(inc -> inc.getIdea() != null && inc.getIdea().getId().equals(ideaId))
                .findFirst()
                .orElse(new Incubation());

        incubation.setIdea(idea);
        incubation.setStatus("ACTIVE");
        incubation.setProgramName(idea.getTitle());

        if (mentorId != null && mentorRepository != null) {
            mentorRepository.findById(mentorId).ifPresent(incubation::setMentor);
        }

        if (investorId != null && investorRepository != null) {
            investorRepository.findById(investorId).ifPresent(incubation::setInvestor);
        }

        return incubationRepository.save(incubation);
    }

    @Transactional
    public void addTimelineLog(Long incubationId, String phaseTitle, Double progressPercentage) {
        Incubation incubation = incubationRepository.findById(incubationId)
                .orElseThrow(() -> new RuntimeException("Incubation not found with id: " + incubationId));

        IncubationTimelineLog log = new IncubationTimelineLog();
        log.setIncubation(incubation);
        log.setPhaseTitle(phaseTitle);
        log.setProgressPercentage(progressPercentage != null ? progressPercentage : 0.0);
        log.setUpdatedAt(LocalDateTime.now());

        timelineLogRepository.save(log);
    }

    public List<Incubation> getIncubationsByUserEmail(String email) {
        if (email == null) {
            return new ArrayList<>();
        }
        List<Incubation> allIncubations = incubationRepository.findAll();

        return allIncubations.stream()
                .filter(inc -> (inc.getInvestorEmail() != null && inc.getInvestorEmail().equalsIgnoreCase(email)) ||
                        (inc.getProgramName() != null))
                .collect(Collectors.toList());
    }

    @Transactional
    public Incubation updateIncubationStatus(Long id, String newStatus, Authentication auth, Long mentorId, Long investorId) {
        Incubation incubation = incubationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Incubation not found with id: " + id));

        String oldStatus = incubation.getStatus();
        incubation.setStatus(newStatus);

        if (mentorId != null && mentorRepository != null) {
            mentorRepository.findById(mentorId).ifPresent(incubation::setMentor);
        }

        if (investorId != null && investorRepository != null) {
            investorRepository.findById(investorId).ifPresent(incubation::setInvestor);
        }

        Incubation updated = incubationRepository.save(incubation);

        if (("COMPLETED".equalsIgnoreCase(newStatus) || "FINISHED".equalsIgnoreCase(newStatus))
                && !"COMPLETED".equalsIgnoreCase(oldStatus)) {

            if (userRepository != null && incubation.getUserId() != null) {
                userRepository.findById(incubation.getUserId()).ifPresent(user -> {
                    Notification notification = new Notification();
                    notification.setUser(user);
                    notification.setTitle("Feedback Request");
                    notification.setMessage("Your incubation has ended. Please share your valuable feedback.");
                    notification.setTargetRole("STUDENT");
                    notification.setRead(false);
                    notification.setCreatedAt(LocalDateTime.now());

                    notificationRepository.save(notification);
                });
            }
        }

        return updated;
    }

    public List<User> getIncubationMembers(Long id) {
        if (userRepository != null) {
            List<User> allUsers = userRepository.findAll();
            return allUsers.stream()
                    .filter(user -> user.getRole() != null && user.getRole().name().toUpperCase().contains("ADMIN"))
                    .collect(Collectors.toList());
        }
        return new ArrayList<>();
    }
}