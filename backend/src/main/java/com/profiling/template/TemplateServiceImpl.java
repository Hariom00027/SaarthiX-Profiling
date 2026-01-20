package com.profiling.template;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.stereotype.Service;

import com.mongodb.MongoException;
import com.profiling.exception.BadRequestException;
import com.profiling.exception.DataSaveException;
import com.profiling.exception.DatabaseConnectionException;
import com.profiling.exception.NotFoundException;

@Service
public class TemplateServiceImpl implements TemplateService {

    private final TemplateRepository templateRepository;
    private static final Logger log = LoggerFactory.getLogger(TemplateServiceImpl.class);

    public TemplateServiceImpl(TemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Override
    public Optional<TemplateEntity> getTemplateByType(String type, String userId) {
        String normalizedType = normalizeType(type);
        // First try to get user custom template, then fall back to global template
        Optional<TemplateEntity> customTemplate = findByIdAndUser(normalizedType, userId);
        if (customTemplate.isPresent()) {
            return customTemplate;
        }
        return findByIdAndUserIsNull(normalizedType);
    }

    @Override
    public TemplateEntity saveTemplate(TemplateEntity template, String userId) {
        String normalizedType = normalizeType(template.getId());
        // Check if user already has a custom template with this type
        if (findByIdAndUser(normalizedType, userId).isPresent()) {
            throw new BadRequestException("Template with type '" + normalizedType + "' already exists for this user.");
        }

        Instant now = Instant.now();
        template.setId(normalizedType);
        template.setUserId(userId);
        template.setIsUserCustomTemplate(true);
        template.setCreatedAt(now);
        template.setUpdatedAt(now);

        TemplateEntity saved = saveTemplateEntity(template);
        log.info("Template {} saved for userId={}", normalizedType, userId);
        return saved;
    }

    @Override
    public TemplateEntity updateTemplate(String type, TemplateEntity updateRequest, String userId) {
        String normalizedType = normalizeType(type);
        TemplateEntity existing = findByIdAndUser(normalizedType, userId)
                .orElseThrow(() -> new NotFoundException(
                        "Template with type '" + normalizedType + "' not found for this user."));

        if (updateRequest.getName() != null) {
            existing.setName(updateRequest.getName());
        }
        if (updateRequest.getDescription() != null) {
            existing.setDescription(updateRequest.getDescription());
        }
        if (updateRequest.getIcon() != null) {
            existing.setIcon(updateRequest.getIcon());
        }
        if (updateRequest.getContent() != null) {
            existing.setContent(updateRequest.getContent());
        }
        if (updateRequest.getCss() != null) {
            existing.setCss(updateRequest.getCss());
        }
        if (updateRequest.getPreviewImageUrl() != null) {
            existing.setPreviewImageUrl(updateRequest.getPreviewImageUrl());
        }
        existing.setUpdatedAt(Instant.now());

        TemplateEntity updated = saveTemplateEntity(existing);
        log.info("Template {} updated for userId={}", normalizedType, userId);
        return updated;
    }

    @Override
    public List<TemplateEntity> listDefaultTemplates() {
        return findAllDefaults();
    }

    @Override
    public List<TemplateEntity> listCustomTemplates(String userId) {
        return findAllByUser(userId);
    }

    @Override
    public List<TemplateEntity> listAllTemplatesForUser(String userId) {
        List<TemplateEntity> allTemplates = new ArrayList<>(findAllDefaults());
        allTemplates.addAll(findAllByUser(userId));
        return allTemplates;
    }

    @Override
    public void deleteTemplate(String type, String userId) {
        String normalizedType = normalizeType(type);
        Optional<TemplateEntity> template = findByIdAndUser(normalizedType, userId);
        if (template.isEmpty()) {
            throw new NotFoundException("Template with type '" + normalizedType + "' not found for this user.");
        }
        deleteTemplateEntity(template.get());
        log.info("Template {} deleted for userId={}", normalizedType, userId);
    }

    private String normalizeType(String type) {
        if (type == null || type.isBlank()) {
            throw new BadRequestException("Template type must be provided.");
        }
        return type.trim().toLowerCase();
    }

    private Optional<TemplateEntity> findByIdAndUser(String id, String userId) {
        try {
            return templateRepository.findByIdAndUserId(id, userId);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to fetch template {} for userId={}: {}", id, userId, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch template", e);
        }
    }

    private Optional<TemplateEntity> findByIdAndUserIsNull(String id) {
        try {
            return templateRepository.findByIdAndUserIdIsNull(id);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to fetch default template {}: {}", id, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch template", e);
        }
    }

    private TemplateEntity saveTemplateEntity(TemplateEntity templateEntity) {
        try {
            return templateRepository.save(templateEntity);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to save template {}: {}", templateEntity.getId(), e.getMessage(), e);
            throw new DataSaveException("Failed to save template", e);
        }
    }

    private List<TemplateEntity> findAllDefaults() {
        try {
            return templateRepository.findAllByUserIdIsNull();
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to list default templates: {}", e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch templates", e);
        }
    }

    private List<TemplateEntity> findAllByUser(String userId) {
        try {
            return templateRepository.findAllByUserId(userId);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to list custom templates for userId={}: {}", userId, e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to fetch templates", e);
        }
    }

    private void deleteTemplateEntity(TemplateEntity templateEntity) {
        try {
            templateRepository.delete(templateEntity);
        } catch (DataAccessException | MongoException e) {
            log.error("Failed to delete template {}: {}", templateEntity.getId(), e.getMessage(), e);
            throw new DatabaseConnectionException("Failed to delete template", e);
        }
    }

    @Override
    public List<TemplateEntity> listAllDefaultTemplates() {
        return listDefaultTemplates();
    }

    @Override
    public TemplateEntity saveGlobalTemplate(TemplateEntity template) {
        String normalizedType = normalizeType(template.getId());
        // Check if global template already exists
        if (findByIdAndUserIsNull(normalizedType).isPresent()) {
            throw new BadRequestException("Global template with type '" + normalizedType + "' already exists.");
        }

        Instant now = Instant.now();
        template.setId(normalizedType);
        template.setUserId(null);
        template.setIsUserCustomTemplate(false);
        template.setCreatedAt(now);
        template.setUpdatedAt(now);

        TemplateEntity saved = saveTemplateEntity(template);
        log.info("Global template {} saved", normalizedType);
        return saved;
    }

    @Override
    public TemplateEntity updateGlobalTemplate(String type, TemplateEntity template) {
        String normalizedType = normalizeType(type);
        TemplateEntity existing = findByIdAndUserIsNull(normalizedType)
                .orElseThrow(() -> new NotFoundException(
                        "Global template with type '" + normalizedType + "' not found."));

        if (template.getName() != null) {
            existing.setName(template.getName());
        }
        if (template.getDescription() != null) {
            existing.setDescription(template.getDescription());
        }
        if (template.getIcon() != null) {
            existing.setIcon(template.getIcon());
        }
        if (template.getContent() != null) {
            existing.setContent(template.getContent());
        }
        if (template.getCss() != null) {
            existing.setCss(template.getCss());
        }
        if (template.getPreviewImageUrl() != null) {
            existing.setPreviewImageUrl(template.getPreviewImageUrl());
        }
        if (template.getEnabled() != null) {
            existing.setEnabled(template.getEnabled());
        }
        existing.setUpdatedAt(Instant.now());

        TemplateEntity updated = saveTemplateEntity(existing);
        log.info("Global template {} updated", normalizedType);
        return updated;
    }

    @Override
    public void deleteGlobalTemplate(String type) {
        String normalizedType = normalizeType(type);
        Optional<TemplateEntity> template = findByIdAndUserIsNull(normalizedType);
        if (template.isEmpty()) {
            throw new NotFoundException("Global template with type '" + normalizedType + "' not found.");
        }
        deleteTemplateEntity(template.get());
        log.info("Global template {} deleted", normalizedType);
    }
}


