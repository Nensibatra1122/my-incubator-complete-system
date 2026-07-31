package com.example.demo.config;

import com.example.demo.filter.JwtAuthenticationFilter;
import com.example.demo.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Autowired
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @Autowired
    private UserService userService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(Customizer.withDefaults())
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public Endpoints & Auth Routes
                        .requestMatchers("/api/auth/**", "/api/public/**").permitAll()

                        // Public GET Feeds
                        .requestMatchers(HttpMethod.GET, "/api/mentors/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/timelines/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/progress/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ideas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags/**").permitAll()

                        // General context paths matching
                        .requestMatchers("/incubations/**", "/progress/**", "/analytics/**").permitAll()

                        // Incubations / Startups Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/incubations/**").hasAnyRole("ADMIN", "MENTOR", "STUDENT", "USER", "INVESTOR")
                        .requestMatchers(HttpMethod.POST, "/api/incubations/**").hasAnyRole("ADMIN", "MENTOR")
                        .requestMatchers(HttpMethod.PUT, "/api/incubations/**").hasAnyRole("ADMIN", "MENTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/incubations/**").hasRole("ADMIN")

                        // Progress Endpoints
                        .requestMatchers("/api/progress/**").hasAnyRole("ADMIN", "MENTOR", "STUDENT", "USER", "INVESTOR")

                        // System Audit & Operation Logs -> Admin Only
                        .requestMatchers("/api/logs/**").hasRole("ADMIN")

                        // Incubator Analytics -> Admin Only
                        .requestMatchers("/api/analytics/**").hasRole("ADMIN")

                        // Idea Pipeline & Chat Mutations -> Authenticated Users (Including Investor)
                        .requestMatchers("/api/ideas/**").hasAnyRole("ADMIN", "MENTOR", "STUDENT", "USER", "INVESTOR")

                        // Notifications -> Accessible to all authenticated users
                        .requestMatchers("/api/notifications/**").authenticated()

                        // Tags Management Mutations -> Admin only
                        .requestMatchers(HttpMethod.POST, "/api/tags/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/tags/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/tags/**").hasRole("ADMIN")

                        // Investors Endpoints Restrictions
                        .requestMatchers(HttpMethod.GET, "/api/investors/**").hasAnyRole("ADMIN", "STUDENT", "MENTOR", "INVESTOR")
                        .requestMatchers(HttpMethod.POST, "/api/investors/**").hasRole("ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/investors/**").hasAnyRole("ADMIN", "INVESTOR")
                        .requestMatchers(HttpMethod.DELETE, "/api/investors/**").hasRole("ADMIN")

                        // Any other request requires authentication
                        .anyRequest().authenticated()
                )
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173", "http://98.94.6.13"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider authProvider = new DaoAuthenticationProvider();
        authProvider.setUserDetailsService(userService);
        authProvider.setPasswordEncoder(passwordEncoder());
        return authProvider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new PasswordEncoder() {
            private final BCryptPasswordEncoder bCryptEncoder = new BCryptPasswordEncoder();

            @Override
            public String encode(CharSequence rawPassword) {
                return bCryptEncoder.encode(rawPassword);
            }

            @Override
            public boolean matches(CharSequence rawPassword, String encodedPassword) {
                if (encodedPassword == null || (!encodedPassword.startsWith("$2a$") && !encodedPassword.startsWith("$2b$"))) {
                    return rawPassword.toString().equals(encodedPassword);
                }
                return bCryptEncoder.matches(rawPassword, encodedPassword);
            }
        };
    }
}