package com.profiling.template;

import java.util.List;
import java.util.Optional;

public interface TemplateService {

    Optional<TemplateEntity> getTemplateByType(String type, String userId);

    TemplateEntity saveTemplate(TemplateEntity template, String userId);

    TemplateEntity updateTemplate(String type, TemplateEntity updateRequest, String userId);

    List<TemplateEntity> listDefaultTemplates(); // Global templates (userId = null)

    List<TemplateEntity> listCustomTemplates(String userId); // User custom templates

    List<TemplateEntity> listAllTemplatesForUser(String userId); // Both default + custom

    void deleteTemplate(String type, String userId);

    // Admin methods for global templates
    List<TemplateEntity> listAllDefaultTemplates(); // Alias for listDefaultTemplates

    TemplateEntity saveGlobalTemplate(TemplateEntity template);

    TemplateEntity updateGlobalTemplate(String type, TemplateEntity template);

    void deleteGlobalTemplate(String type);
}


