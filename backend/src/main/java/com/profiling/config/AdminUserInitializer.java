package com.profiling.config;

import com.profiling.model.User;
import com.profiling.model.UserRole;
import com.profiling.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
public class AdminUserInitializer implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AdminUserInitializer.class);

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.name:Admin}")
    private String adminName;

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Autowired
    public AdminUserInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (adminEmail == null || adminEmail.isBlank()) {
            log.info("Admin user initialization skipped: app.admin.email is not configured.");
            return;
        }

        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("Admin user initialization skipped: app.admin.password is empty.");
            return;
        }

        Optional<User> existingAdmin = userRepository.findByEmail(adminEmail);
        if (existingAdmin.isPresent()) {
            User admin = existingAdmin.get();
            boolean dirty = false;

            if (!admin.isAdmin()) {
                admin.setRole(UserRole.ADMIN);
                dirty = true;
            }

            if (!adminName.equals(admin.getName())) {
                admin.setName(adminName);
                dirty = true;
            }

            if (!passwordEncoder.matches(adminPassword, admin.getPassword())) {
                admin.setPassword(passwordEncoder.encode(adminPassword));
                dirty = true;
            }

            if (dirty) {
                userRepository.save(admin);
                log.info("Admin user {} synchronized with configured credentials.", adminEmail);
            }
        } else {
            User admin = new User();
            admin.setEmail(adminEmail);
            admin.setName(adminName);
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setProvider("local");
            admin.setRole(UserRole.ADMIN);

            userRepository.save(admin);
            log.info("Admin user {} created from configuration.", adminEmail);
        }
    }
}

