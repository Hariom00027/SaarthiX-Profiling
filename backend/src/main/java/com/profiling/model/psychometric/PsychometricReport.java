package com.profiling.model.psychometric;

import java.time.Instant;
import java.util.List;

public class PsychometricReport {
    
    // User Information
    private UserInfo userInfo;
    private String university;
    private Integer yearOfGraduation;
    
    // Summary and Bio
    private String summaryBio;
    private String interviewSummary;
    
    // SWOT Analysis
    private List<String> strengths;
    private List<String> weaknesses;
    private List<String> opportunities;
    private List<String> threats;
    private String swotAnalysis; // Detailed narrative
    
    // Big Five Personality Traits (0-100 scale)
    private Integer openness;
    private Integer conscientiousness;
    private Integer extraversion;
    private Integer agreeableness;
    private Integer neuroticism;
    
    // Performance Scores
    private Double aptitudeScore; // Percentage
    private Double behavioralScore; // Percentage
    private Double domainScore; // Percentage
    private Double overallScore; // Overall percentage
    
    // Test Results
    private Integer totalQuestions;
    private Integer attempted;
    private Integer correct;
    private Integer wrong;
    private Integer notAttempted;
    private Double candidatePercentile; // 0-100
    
    // Performance Buckets
    private String performanceBucket; // "POOR", "AVERAGE", "GOOD", "BEST"
    
    // Fit Analysis
    private String fitAnalysis; // Career fit narrative
    private String behavioralInsights;
    private String domainInsights;
    private String narrativeSummary;
    
    // Charts Data
    private ChartData chartsData;
    
    // Metadata
    private Instant timestamp;
    private Instant reportGeneratedAt;
    
    // Nested class for chart data
    public static class ChartData {
        private Integer poorScore;
        private Integer averageScore;
        private Integer bestScore;
        private String candidatePosition; // "POOR", "AVERAGE", "BEST"
        
        public ChartData() {}
        
        public ChartData(Integer poorScore, Integer averageScore, Integer bestScore, String candidatePosition) {
            this.poorScore = poorScore;
            this.averageScore = averageScore;
            this.bestScore = bestScore;
            this.candidatePosition = candidatePosition;
        }
        
        public Integer getPoorScore() {
            return poorScore;
        }
        
        public void setPoorScore(Integer poorScore) {
            this.poorScore = poorScore;
        }
        
        public Integer getAverageScore() {
            return averageScore;
        }
        
        public void setAverageScore(Integer averageScore) {
            this.averageScore = averageScore;
        }
        
        public Integer getBestScore() {
            return bestScore;
        }
        
        public void setBestScore(Integer bestScore) {
            this.bestScore = bestScore;
        }
        
        public String getCandidatePosition() {
            return candidatePosition;
        }
        
        public void setCandidatePosition(String candidatePosition) {
            this.candidatePosition = candidatePosition;
        }
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

