package com.profiling.dto.psychometric;

import java.time.Instant;
import java.util.List;

import com.profiling.model.psychometric.PsychometricReport;
import com.profiling.model.psychometric.PsychometricReport.ChartData;
import com.profiling.model.psychometric.UserInfo;

public class PsychometricReportResponse {
    
    private UserInfo userInfo;
    private String university;
    private Integer yearOfGraduation;
    private String summaryBio;
    private String interviewSummary;
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> opportunities;
    private List<String> threats;
    private String swotAnalysis;
    private Integer openness;
    private Integer conscientiousness;
    private Integer extraversion;
    private Integer agreeableness;
    private Integer neuroticism;
    private Double aptitudeScore;
    private Double behavioralScore;
    private Double domainScore;
    private Double overallScore;
    private Integer totalQuestions;
    private Integer attempted;
    private Integer correct;
    private Integer wrong;
    private Integer notAttempted;
    private Double candidatePercentile;
    private String performanceBucket;
    private String fitAnalysis;
    private String behavioralInsights;
    private String domainInsights;
    private String narrativeSummary;
    private ChartData chartsData;
    private Instant timestamp;
    private Instant reportGeneratedAt;
    
    public static PsychometricReportResponse from(PsychometricReport report) {
        PsychometricReportResponse response = new PsychometricReportResponse();
        response.setUserInfo(report.getUserInfo());
        response.setUniversity(report.getUniversity());
        response.setYearOfGraduation(report.getYearOfGraduation());
        response.setSummaryBio(report.getSummaryBio());
        response.setInterviewSummary(report.getInterviewSummary());
        response.setStrengths(report.getStrengths());
        response.setWeaknesses(report.getWeaknesses());
        response.setOpportunities(report.getOpportunities());
        response.setThreats(report.getThreats());
        response.setSwotAnalysis(report.getSwotAnalysis());
        response.setOpenness(report.getOpenness());
        response.setConscientiousness(report.getConscientiousness());
        response.setExtraversion(report.getExtraversion());
        response.setAgreeableness(report.getAgreeableness());
        response.setNeuroticism(report.getNeuroticism());
        response.setAptitudeScore(report.getAptitudeScore());
        response.setBehavioralScore(report.getBehavioralScore());
        response.setDomainScore(report.getDomainScore());
        response.setOverallScore(report.getOverallScore());
        response.setTotalQuestions(report.getTotalQuestions());
        response.setAttempted(report.getAttempted());
        response.setCorrect(report.getCorrect());
        response.setWrong(report.getWrong());
        response.setNotAttempted(report.getNotAttempted());
        response.setCandidatePercentile(report.getCandidatePercentile());
        response.setPerformanceBucket(report.getPerformanceBucket());
        response.setFitAnalysis(report.getFitAnalysis());
        response.setBehavioralInsights(report.getBehavioralInsights());
        response.setDomainInsights(report.getDomainInsights());
        response.setNarrativeSummary(report.getNarrativeSummary());
        response.setChartsData(report.getChartsData());
        response.setTimestamp(report.getTimestamp());
        response.setReportGeneratedAt(report.getReportGeneratedAt());
        return response;
    }
    
    // Getters and Setters
    public UserInfo getUserInfo() {
        return userInfo;
    }
    
    public void setUserInfo(UserInfo userInfo) {
        this.userInfo = userInfo;
    }
    
    public String getUniversity() {
        return university;
    }
    
    public void setUniversity(String university) {
        this.university = university;
    }
    
    public Integer getYearOfGraduation() {
        return yearOfGraduation;
    }
    
    public void setYearOfGraduation(Integer yearOfGraduation) {
        this.yearOfGraduation = yearOfGraduation;
    }
    
    public String getSummaryBio() {
        return summaryBio;
    }
    
    public void setSummaryBio(String summaryBio) {
        this.summaryBio = summaryBio;
    }
    
    public String getInterviewSummary() {
        return interviewSummary;
    }
    
    public void setInterviewSummary(String interviewSummary) {
        this.interviewSummary = interviewSummary;
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
    
    public List<String> getOpportunities() {
        return opportunities;
    }
    
    public void setOpportunities(List<String> opportunities) {
        this.opportunities = opportunities;
    }
    
    public List<String> getThreats() {
        return threats;
    }
    
    public void setThreats(List<String> threats) {
        this.threats = threats;
    }
    
    public String getSwotAnalysis() {
        return swotAnalysis;
    }
    
    public void setSwotAnalysis(String swotAnalysis) {
        this.swotAnalysis = swotAnalysis;
    }
    
    public Integer getOpenness() {
        return openness;
    }
    
    public void setOpenness(Integer openness) {
        this.openness = openness;
    }
    
    public Integer getConscientiousness() {
        return conscientiousness;
    }
    
    public void setConscientiousness(Integer conscientiousness) {
        this.conscientiousness = conscientiousness;
    }
    
    public Integer getExtraversion() {
        return extraversion;
    }
    
    public void setExtraversion(Integer extraversion) {
        this.extraversion = extraversion;
    }
    
    public Integer getAgreeableness() {
        return agreeableness;
    }
    
    public void setAgreeableness(Integer agreeableness) {
        this.agreeableness = agreeableness;
    }
    
    public Integer getNeuroticism() {
        return neuroticism;
    }
    
    public void setNeuroticism(Integer neuroticism) {
        this.neuroticism = neuroticism;
    }
    
    public Double getAptitudeScore() {
        return aptitudeScore;
    }
    
    public void setAptitudeScore(Double aptitudeScore) {
        this.aptitudeScore = aptitudeScore;
    }
    
    public Double getBehavioralScore() {
        return behavioralScore;
    }
    
    public void setBehavioralScore(Double behavioralScore) {
        this.behavioralScore = behavioralScore;
    }
    
    public Double getDomainScore() {
        return domainScore;
    }
    
    public void setDomainScore(Double domainScore) {
        this.domainScore = domainScore;
    }
    
    public Double getOverallScore() {
        return overallScore;
    }
    
    public void setOverallScore(Double overallScore) {
        this.overallScore = overallScore;
    }
    
    public Integer getTotalQuestions() {
        return totalQuestions;
    }
    
    public void setTotalQuestions(Integer totalQuestions) {
        this.totalQuestions = totalQuestions;
    }
    
    public Integer getAttempted() {
        return attempted;
    }
    
    public void setAttempted(Integer attempted) {
        this.attempted = attempted;
    }
    
    public Integer getCorrect() {
        return correct;
    }
    
    public void setCorrect(Integer correct) {
        this.correct = correct;
    }
    
    public Integer getWrong() {
        return wrong;
    }
    
    public void setWrong(Integer wrong) {
        this.wrong = wrong;
    }
    
    public Integer getNotAttempted() {
        return notAttempted;
    }
    
    public void setNotAttempted(Integer notAttempted) {
        this.notAttempted = notAttempted;
    }
    
    public Double getCandidatePercentile() {
        return candidatePercentile;
    }
    
    public void setCandidatePercentile(Double candidatePercentile) {
        this.candidatePercentile = candidatePercentile;
    }
    
    public String getPerformanceBucket() {
        return performanceBucket;
    }
    
    public void setPerformanceBucket(String performanceBucket) {
        this.performanceBucket = performanceBucket;
    }
    
    public String getFitAnalysis() {
        return fitAnalysis;
    }
    
    public void setFitAnalysis(String fitAnalysis) {
        this.fitAnalysis = fitAnalysis;
    }
    
    public String getBehavioralInsights() {
        return behavioralInsights;
    }
    
    public void setBehavioralInsights(String behavioralInsights) {
        this.behavioralInsights = behavioralInsights;
    }
    
    public String getDomainInsights() {
        return domainInsights;
    }
    
    public void setDomainInsights(String domainInsights) {
        this.domainInsights = domainInsights;
    }
    
    public String getNarrativeSummary() {
        return narrativeSummary;
    }
    
    public void setNarrativeSummary(String narrativeSummary) {
        this.narrativeSummary = narrativeSummary;
    }
    
    public ChartData getChartsData() {
        return chartsData;
    }
    
    public void setChartsData(ChartData chartsData) {
        this.chartsData = chartsData;
    }
    
    public Instant getTimestamp() {
        return timestamp;
    }
    
    public void setTimestamp(Instant timestamp) {
        this.timestamp = timestamp;
    }
    
    public Instant getReportGeneratedAt() {
        return reportGeneratedAt;
    }
    
    public void setReportGeneratedAt(Instant reportGeneratedAt) {
        this.reportGeneratedAt = reportGeneratedAt;
    }
}

