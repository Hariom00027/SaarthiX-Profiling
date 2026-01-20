package com.profiling.dto;

import java.util.List;
import java.util.Map;

import com.profiling.model.psychometric.UserInfo;

/**
 * DTO for PDF report download request
 * Contains all data needed to generate a psychometric report PDF
 */
public class ReportDownloadRequest {
    
    private UserInfo userInfo;
    private Scores scores;
    private SWOT swot;
    private Analysis analysis;
    private Education education;
    private Personality personality;
    private ChartData chartsData;
    private String reportGeneratedAt;
    
    // Nested classes for structured data
    public static class Scores {
        private Integer correct;
        private Integer totalQuestions;
        private Double candidatePercentile;
        private Double aptitudeScore;
        private Double behavioralScore;
        private Double domainScore;
        private Double overallScore;
        
        public Scores() {}
        
        public Integer getCorrect() { return correct; }
        public void setCorrect(Integer correct) { this.correct = correct; }
        
        public Integer getTotalQuestions() { return totalQuestions; }
        public void setTotalQuestions(Integer totalQuestions) { this.totalQuestions = totalQuestions; }
        
        public Double getCandidatePercentile() { return candidatePercentile; }
        public void setCandidatePercentile(Double candidatePercentile) { this.candidatePercentile = candidatePercentile; }
        
        public Double getAptitudeScore() { return aptitudeScore; }
        public void setAptitudeScore(Double aptitudeScore) { this.aptitudeScore = aptitudeScore; }
        
        public Double getBehavioralScore() { return behavioralScore; }
        public void setBehavioralScore(Double behavioralScore) { this.behavioralScore = behavioralScore; }
        
        public Double getDomainScore() { return domainScore; }
        public void setDomainScore(Double domainScore) { this.domainScore = domainScore; }
        
        public Double getOverallScore() { return overallScore; }
        public void setOverallScore(Double overallScore) { this.overallScore = overallScore; }
    }
    
    public static class SWOT {
        private List<String> strengths;
        private List<String> weaknesses;
        private List<String> opportunities;
        private List<String> threats;
        private String swotAnalysis;
        
        public SWOT() {}
        
        public List<String> getStrengths() { return strengths; }
        public void setStrengths(List<String> strengths) { this.strengths = strengths; }
        
        public List<String> getWeaknesses() { return weaknesses; }
        public void setWeaknesses(List<String> weaknesses) { this.weaknesses = weaknesses; }
        
        public List<String> getOpportunities() { return opportunities; }
        public void setOpportunities(List<String> opportunities) { this.opportunities = opportunities; }
        
        public List<String> getThreats() { return threats; }
        public void setThreats(List<String> threats) { this.threats = threats; }
        
        public String getSwotAnalysis() { return swotAnalysis; }
        public void setSwotAnalysis(String swotAnalysis) { this.swotAnalysis = swotAnalysis; }
    }
    
    public static class Analysis {
        private String summaryBio;
        private String interviewSummary;
        private String fitAnalysis;
        private String behavioralInsights;
        private String domainInsights;
        private String narrativeSummary;
        
        public Analysis() {}
        
        public String getSummaryBio() { return summaryBio; }
        public void setSummaryBio(String summaryBio) { this.summaryBio = summaryBio; }
        
        public String getInterviewSummary() { return interviewSummary; }
        public void setInterviewSummary(String interviewSummary) { this.interviewSummary = interviewSummary; }
        
        public String getFitAnalysis() { return fitAnalysis; }
        public void setFitAnalysis(String fitAnalysis) { this.fitAnalysis = fitAnalysis; }
        
        public String getBehavioralInsights() { return behavioralInsights; }
        public void setBehavioralInsights(String behavioralInsights) { this.behavioralInsights = behavioralInsights; }
        
        public String getDomainInsights() { return domainInsights; }
        public void setDomainInsights(String domainInsights) { this.domainInsights = domainInsights; }
        
        public String getNarrativeSummary() { return narrativeSummary; }
        public void setNarrativeSummary(String narrativeSummary) { this.narrativeSummary = narrativeSummary; }
    }
    
    public static class Education {
        private String university;
        private Integer yearOfGraduation;
        private String degree;
        
        public Education() {}
        
        public String getUniversity() { return university; }
        public void setUniversity(String university) { this.university = university; }
        
        public Integer getYearOfGraduation() { return yearOfGraduation; }
        public void setYearOfGraduation(Integer yearOfGraduation) { this.yearOfGraduation = yearOfGraduation; }
        
        public String getDegree() { return degree; }
        public void setDegree(String degree) { this.degree = degree; }
    }
    
    public static class Personality {
        private Integer openness;
        private Integer conscientiousness;
        private Integer extraversion;
        private Integer agreeableness;
        private Integer neuroticism;
        
        public Personality() {}
        
        public Integer getOpenness() { return openness; }
        public void setOpenness(Integer openness) { this.openness = openness; }
        
        public Integer getConscientiousness() { return conscientiousness; }
        public void setConscientiousness(Integer conscientiousness) { this.conscientiousness = conscientiousness; }
        
        public Integer getExtraversion() { return extraversion; }
        public void setExtraversion(Integer extraversion) { this.extraversion = extraversion; }
        
        public Integer getAgreeableness() { return agreeableness; }
        public void setAgreeableness(Integer agreeableness) { this.agreeableness = agreeableness; }
        
        public Integer getNeuroticism() { return neuroticism; }
        public void setNeuroticism(Integer neuroticism) { this.neuroticism = neuroticism; }
    }
    
    public static class ChartData {
        private Integer poorScore;
        private Integer averageScore;
        private Integer bestScore;
        private String candidatePosition;
        
        public ChartData() {}
        
        public Integer getPoorScore() { return poorScore; }
        public void setPoorScore(Integer poorScore) { this.poorScore = poorScore; }
        
        public Integer getAverageScore() { return averageScore; }
        public void setAverageScore(Integer averageScore) { this.averageScore = averageScore; }
        
        public Integer getBestScore() { return bestScore; }
        public void setBestScore(Integer bestScore) { this.bestScore = bestScore; }
        
        public String getCandidatePosition() { return candidatePosition; }
        public void setCandidatePosition(String candidatePosition) { this.candidatePosition = candidatePosition; }
    }
    
    // Getters and Setters
    public UserInfo getUserInfo() { return userInfo; }
    public void setUserInfo(UserInfo userInfo) { this.userInfo = userInfo; }
    
    public Scores getScores() { return scores; }
    public void setScores(Scores scores) { this.scores = scores; }
    
    public SWOT getSwot() { return swot; }
    public void setSwot(SWOT swot) { this.swot = swot; }
    
    public Analysis getAnalysis() { return analysis; }
    public void setAnalysis(Analysis analysis) { this.analysis = analysis; }
    
    public Education getEducation() { return education; }
    public void setEducation(Education education) { this.education = education; }
    
    public Personality getPersonality() { return personality; }
    public void setPersonality(Personality personality) { this.personality = personality; }
    
    public ChartData getChartsData() { return chartsData; }
    public void setChartsData(ChartData chartsData) { this.chartsData = chartsData; }
    
    public String getReportGeneratedAt() { return reportGeneratedAt; }
    public void setReportGeneratedAt(String reportGeneratedAt) { this.reportGeneratedAt = reportGeneratedAt; }
}
















