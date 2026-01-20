package com.profiling.dto;

import java.util.List;
import java.util.Map;

/**
 * DTO representing the final evaluation result from the chatbot
 */
public class EvaluationResult {
    private Map<String, Double> interests;
    private List<String> pieChartLabels;
    private List<Double> pieChartValues;
    private String interestPersona;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> dos;
    private List<String> donts;
    private List<String> recommendedRoles;
    private String roadmap90Days;
    private List<String> suggestedCourses;
    private List<String> projectIdeas;
    private String summary;
    private Map<String, String> invalidAnswers;

    public EvaluationResult() {
    }

    public Map<String, Double> getInterests() {
        return interests;
    }

    public void setInterests(Map<String, Double> interests) {
        this.interests = interests;
    }

    public List<String> getPieChartLabels() {
        return pieChartLabels;
    }

    public void setPieChartLabels(List<String> pieChartLabels) {
        this.pieChartLabels = pieChartLabels;
    }

    public List<Double> getPieChartValues() {
        return pieChartValues;
    }

    public void setPieChartValues(List<Double> pieChartValues) {
        this.pieChartValues = pieChartValues;
    }

    public String getInterestPersona() {
        return interestPersona;
    }

    public void setInterestPersona(String interestPersona) {
        this.interestPersona = interestPersona;
    }

    public List<String> getStrengths() {
        return strengths;
    }

    public void setStrengths(List<String> strengths) {
        this.strengths = strengths;
    }

    public List<String> getWeaknesses() {
        return weaknesses;
    }

    public void setWeaknesses(List<String> weaknesses) {
        this.weaknesses = weaknesses;
    }

    public List<String> getDos() {
        return dos;
    }

    public void setDos(List<String> dos) {
        this.dos = dos;
    }

    public List<String> getDonts() {
        return donts;
    }

    public void setDonts(List<String> donts) {
        this.donts = donts;
    }

    public List<String> getRecommendedRoles() {
        return recommendedRoles;
    }

    public void setRecommendedRoles(List<String> recommendedRoles) {
        this.recommendedRoles = recommendedRoles;
    }

    public String getRoadmap90Days() {
        return roadmap90Days;
    }

    public void setRoadmap90Days(String roadmap90Days) {
        this.roadmap90Days = roadmap90Days;
    }

    public List<String> getSuggestedCourses() {
        return suggestedCourses;
    }

    public void setSuggestedCourses(List<String> suggestedCourses) {
        this.suggestedCourses = suggestedCourses;
    }

    public List<String> getProjectIdeas() {
        return projectIdeas;
    }

    public void setProjectIdeas(List<String> projectIdeas) {
        this.projectIdeas = projectIdeas;
    }

    public String getSummary() {
        return summary;
    }

    public void setSummary(String summary) {
        this.summary = summary;
    }

    public Map<String, String> getInvalidAnswers() {
        return invalidAnswers;
    }

    public void setInvalidAnswers(Map<String, String> invalidAnswers) {
        this.invalidAnswers = invalidAnswers;
    }
}

