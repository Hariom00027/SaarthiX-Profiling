package com.profiling.dto;

import java.util.Map;

/**
 * Request payload to enhance a single uploaded profile paragraph using psychometric report insights.
 */
public class EnhanceParagraphWithReportRequest {
    private String text;
    private Map<String, Object> reportData;
    private String sessionId;

    public EnhanceParagraphWithReportRequest() {}

    public String getText() {
        return text;
    }

    public void setText(String text) {
        this.text = text;
    }

    public Map<String, Object> getReportData() {
        return reportData;
    }

    public void setReportData(Map<String, Object> reportData) {
        this.reportData = reportData;
    }

    public String getSessionId() {
        return sessionId;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }
}










