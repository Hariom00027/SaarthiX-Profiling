package com.profiling.model;

import com.profiling.template.TemplateRenderResult;

public class ProfileResponse {

    private Profile profile;
    private String templateId;
    private String templateName;
    private String templateDescription;
    private String templateIcon;
    private String templateCss;
    private String templateText;

    public ProfileResponse() {
    }

    public ProfileResponse(Profile profile, TemplateRenderResult renderResult) {
        this.profile = profile;
        if (renderResult != null) {
            this.templateId = renderResult.getTemplateId();
            this.templateName = renderResult.getTemplateName();
            this.templateDescription = renderResult.getTemplateDescription();
            this.templateIcon = renderResult.getTemplateIcon();
            this.templateCss = renderResult.getTemplateCss();
            this.templateText = renderResult.getRenderedText();
        }
    }

    public Profile getProfile() {
        return profile;
    }

    public void setProfile(Profile profile) {
        this.profile = profile;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public String getTemplateName() {
        return templateName;
    }

    public void setTemplateName(String templateName) {
        this.templateName = templateName;
    }

    public String getTemplateDescription() {
        return templateDescription;
    }

    public void setTemplateDescription(String templateDescription) {
        this.templateDescription = templateDescription;
    }

    public String getTemplateIcon() {
        return templateIcon;
    }

    public void setTemplateIcon(String templateIcon) {
        this.templateIcon = templateIcon;
    }

    public String getTemplateCss() {
        return templateCss;
    }

    public void setTemplateCss(String templateCss) {
        this.templateCss = templateCss;
    }

    public String getTemplateText() {
        return templateText;
    }

    public void setTemplateText(String templateText) {
        this.templateText = templateText;
    }
}

