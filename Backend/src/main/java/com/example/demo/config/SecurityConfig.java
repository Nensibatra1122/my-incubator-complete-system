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
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Browser OPTIONS preflight requests
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()

                        // Public Endpoints & Auth Routes
                        .requestMatchers("/api/auth/**", "/api/public/**").permitAll()

                        // Project Discussion Hub Endpoints
                        .requestMatchers("/api/discussion/**").permitAll()

                        // Public GET Feeds & Mentors / Chat / Sessions
                        .requestMatchers(HttpMethod.GET, "/api/mentors/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/comments/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/timelines/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/progress/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/ideas/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/likes/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/tags/**").permitAll()

                        // Profiles Management Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/profiles/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/profiles/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/profiles/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/profiles/**").authenticated()

                        // Chat & Rooms Endpoints
                        .requestMatchers("/api/chat/rooms/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/chat/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/chat/**").permitAll()

                        // Sessions Management Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/sessions/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/sessions/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/sessions/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/sessions/**").authenticated()

                        // General context paths matching
                        .requestMatchers("/incubations/**", "/progress/**", "/analytics/**").permitAll()

                        // Incubations / Startups Endpoints (Explicit GET Permitted for Mentors/Students dashboard sync)
                        .requestMatchers(HttpMethod.GET, "/api/incubations/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/incubations/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/incubations/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/incubations/**").authenticated()

                        // Startups & Finance
                        .requestMatchers("/api/startups/**").authenticated()
                        .requestMatchers("/api/finance/**", "/api/finances/**", "/api/finance-transactions/**").authenticated()

                        // Progress Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/progress/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/progress/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/progress/**").authenticated()

                        // System Audit & Operation Logs
                        .requestMatchers("/api/logs/**").authenticated()

                        // Incubator Analytics (Permitted so dashboards can load counts without 403)
                        .requestMatchers("/api/analytics/**").permitAll()

                        // Idea Pipeline & Chat Mutations
                        .requestMatchers(HttpMethod.POST, "/api/ideas/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/ideas/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/ideas/**").authenticated()

                        // Notifications
                        .requestMatchers("/api/notifications/**").permitAll()

                        // Tags Management Mutations
                        .requestMatchers(HttpMethod.POST, "/api/tags/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/tags/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/tags/**").authenticated()
                        // Investor Interests (Express Interest feature)
                        .requestMatchers(HttpMethod.POST, "/api/investor-interests/**").authenticated()
                        .requestMatchers(HttpMethod.GET, "/api/investor-interests/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/investor-interests/**").authenticated()

                        // Investors Endpoints
                        .requestMatchers(HttpMethod.GET, "/api/investors/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/investors/**").authenticated()
                        .requestMatchers(HttpMethod.PUT, "/api/investors/**").authenticated()
                        .requestMatchers(HttpMethod.DELETE, "/api/investors/**").authenticated()

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
        // Yahan aapka ELB Load Balancer URL add kar diya gaya hai
        configuration.setAllowedOrigins(List.of(
                "http://localhost:5173",
                "http://98.94.6.13",
                "http://incubatorsystem2-779054019.us-east-1.elb.amazonaws.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(List.of("Authorization", "Content-Type"));

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