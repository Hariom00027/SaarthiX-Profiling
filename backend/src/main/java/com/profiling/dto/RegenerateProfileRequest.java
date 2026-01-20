package com.profiling.dto;

import java.util.Map;

public class RegenerateProfileRequest {

    private String userId;
    private String templateId;
    private Map<String, Object> formData;
    private Map<String, Object> chatAnswers;
    private Map<String, Object> reportData;

    public RegenerateProfileRequest() {
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public String getTemplateId() {
        return templateId;
    }

    public void setTemplateId(String templateId) {
        this.templateId = templateId;
    }

    public Map<String, Object> getFormData() {
        return formData;
    }

    public void setFormData(Map<String, Object> formData) {
        this.formData = formData;
    }

    public Map<String, Object> getChatAnswers() {
        return chatAnswers;
    }

    public void setChatAnswers(Map<String, Object> chatAnswers) {
        this.chatAnswers = chatAnswers;
    }

    public Map<String, Object> getReportData() {
        return reportData;
    }

    public void setReportData(Map<String, Object> reportData) {
        this.reportData = reportData;
    }
}

