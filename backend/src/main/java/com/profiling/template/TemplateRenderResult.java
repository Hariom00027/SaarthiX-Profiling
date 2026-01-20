package com.profiling.template;

public class TemplateRenderResult {

    private final TemplateEntity template;
    private final String renderedText;

    public TemplateRenderResult(TemplateEntity template, String renderedText) {
        this.template = template;
        this.renderedText = renderedText;
    }

    public TemplateEntity getTemplate() {
        return template;
    }

    public String getRenderedText() {
        return renderedText;
    }

    public String getTemplateId() {
        return template != null ? template.getId() : null;
    }

    public String getTemplateName() {
        return template != null ? template.getName() : null;
    }

    public String getTemplateDescription() {
        return template != null ? template.getDescription() : null;
    }

    public String getTemplateIcon() {
        return template != null ? template.getIcon() : null;
    }

    public String getTemplateCss() {
        if (template == null) {
            return "";
        }
        String css = template.getCss();
        return css != null ? css : "";
    }

    public String getTemplateContent() {
        return template != null ? template.getContent() : null;
    }
}


