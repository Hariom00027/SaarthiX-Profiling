package com.profiling.template;

import java.util.Optional;

import org.springframework.stereotype.Component;

import com.profiling.model.Profile;

@Component
public class TemplateFactory {

    private static final String DEFAULT_TEMPLATE_TYPE = "professional";

    private final TemplateService templateService;
    private final TemplateEngine templateEngine;

    public TemplateFactory(TemplateService templateService, TemplateEngine templateEngine) {
        this.templateService = templateService;
        this.templateEngine = templateEngine;
    }

    public TemplateRenderResult generate(String templateType, Profile profile) {
        String normalizedType = normalizeType(templateType);
        String userId = profile.getUserId(); // Get userId from profile

        Optional<TemplateEntity> requestedTemplate = templateService.getTemplateByType(normalizedType, userId);
        TemplateEntity template = requestedTemplate
                .orElseGet(() -> templateService.getTemplateByType(DEFAULT_TEMPLATE_TYPE, userId)
                        .orElseThrow(() -> new IllegalStateException(
                                "Default template '" + DEFAULT_TEMPLATE_TYPE + "' is not configured.")));

        String renderedContent = templateEngine.render(template.getContent(), profile);

        if (template.getCss() == null) {
            template.setCss("");
        }

        return new TemplateRenderResult(template, renderedContent);
    }

    private String normalizeType(String templateType) {
        if (templateType == null || templateType.isBlank()) {
            return DEFAULT_TEMPLATE_TYPE;
        }
        return templateType.trim().toLowerCase();
    }
}

