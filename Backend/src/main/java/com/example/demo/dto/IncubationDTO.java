package com.example.demo.dto;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter @Setter
public class IncubationDTO {
    private Long incubationId;
    private String programName;
    private String description;
    private String status;
    private LocalDate startDate; // <-- Yeh field aur iska setter lazmi hona chahiye
    private Integer percentage;
    private String mentor;
}