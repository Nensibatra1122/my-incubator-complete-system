package com.example.demo.dto;
import com.example.demo.model.Role;
import jakarta.validation.constraints.*;
import lombok.Data;
@Data

public class RegistrationDTO {
    @NotBlank
    private String fullName;

    @Email(message = "Email should be valid")
    @NotBlank(message = "Email is required")
    private String email;

    @Size(min= 6 , message= "Password must be at least 6 characters long")
    @NotBlank(message = "Password is required")
    private String password;

    private String bio;

    @NotNull(message = "Role is required")
    private Role role; // Assuming Role is your Enum
}
