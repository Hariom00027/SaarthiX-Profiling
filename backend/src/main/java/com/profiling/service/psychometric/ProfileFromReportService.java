package com.profiling.service.psychometric;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.profiling.model.psychometric.PsychometricReport;
import com.profiling.model.psychometric.UserInfo;

@Service
public class ProfileFromReportService {
    
    /**
     * Generate a first-person professional profile from psychometric report
     * Focuses on strengths and achievements, written as "I am..." format
     */
    public String generateProfileFromReport(PsychometricReport report) {
        if (report == null) {
            throw new IllegalArgumentException("Report cannot be null");
        }
        
        List<String> profileLines = new ArrayList<>();
        UserInfo userInfo = report.getUserInfo();
        
        // Add professional introduction in first person (1-2 lines)
        if (userInfo != null && userInfo.getName() != null) {
            String basicInfo = buildBasicInfoFirstPerson(userInfo, report);
            if (!basicInfo.isEmpty()) {
                profileLines.add(basicInfo);
            }
        }
        
        // Add bio summary in first person (2-3 lines)
        String bioSummary = extractBioSummaryFirstPerson(report);
        if (!bioSummary.isEmpty()) {
            profileLines.add(bioSummary);
        }
        
        // Add key strengths from SWOT in first person - MAIN FOCUS (3-4 lines)
        String strengthsSummary = extractStrengthsSummaryFirstPerson(report);
        if (!strengthsSummary.isEmpty()) {
            profileLines.add(strengthsSummary);
        }
        
        // Add personality traits in first person (2-3 lines)
        String personalitySnippet = extractPersonalitySnippetFirstPerson(report);
        if (!personalitySnippet.isEmpty()) {
            profileLines.add(personalitySnippet);
        }
        
        // Add test performance in first person (1-2 lines)
        String performanceInsight = extractPerformanceInsightFirstPerson(report);
        if (!performanceInsight.isEmpty()) {
            profileLines.add(performanceInsight);
        }
        
        // Add career goals and aspirations in first person (1-2 lines)
        String careerGoals = extractCareerGoalsFirstPerson(report, userInfo);
        if (!careerGoals.isEmpty()) {
            profileLines.add(careerGoals);
        }
        
        // Join all lines with double newline for readability
        return profileLines.stream()
                .filter(line -> !line.isEmpty())
                .collect(Collectors.joining("\n\n"));
    }
    
    private String buildBasicInfoFirstPerson(UserInfo userInfo, PsychometricReport report) {
        StringBuilder info = new StringBuilder();
        info.append("I am ");
        
        boolean hasDegreeInfo = false;
        if (userInfo.getDegree() != null) {
            info.append("a ").append(userInfo.getDegree()).append(" graduate");
            hasDegreeInfo = true;
        }
        
        if (userInfo.getSpecialization() != null) {
            if (hasDegreeInfo) {
                info.append(" specialized in ").append(userInfo.getSpecialization());
            } else {
                info.append("specializing in ").append(userInfo.getSpecialization());
                hasDegreeInfo = true;
            }
        }
        
        if (userInfo.getCareerInterest() != null) {
            if (hasDegreeInfo) {
                info.append(", with a strong passion for ").append(userInfo.getCareerInterest());
            } else {
                info.append("passionate about ").append(userInfo.getCareerInterest());
            }
        }
        
        info.append(".");
        return info.toString();
    }
    
    private String extractBioSummaryFirstPerson(PsychometricReport report) {
        // Build from user info with first-person perspective
        UserInfo userInfo = report.getUserInfo();
        if (userInfo != null) {
            StringBuilder bio = new StringBuilder();
            
            if (userInfo.getTechnicalSkills() != null && !userInfo.getTechnicalSkills().trim().isEmpty()) {
                bio.append("I possess strong technical expertise in ").append(userInfo.getTechnicalSkills())
                   .append(", which enables me to tackle complex challenges effectively. ");
            }
            
            if (userInfo.getSoftSkills() != null && !userInfo.getSoftSkills().trim().isEmpty()) {
                bio.append("I bring excellent interpersonal abilities including ").append(userInfo.getSoftSkills())
                   .append(", making me a valuable team player and collaborator.");
            }
            
            return bio.toString().trim();
        }
        
        return "";
    }
    
    private String extractStrengthsSummaryFirstPerson(PsychometricReport report) {
        if (report.getStrengths() == null || report.getStrengths().isEmpty()) {
            return "";
        }
        
        StringBuilder strengths = new StringBuilder();
        List<String> topStrengths = report.getStrengths().stream()
                .limit(4) // Include up to 4 strengths since this is the main focus
                .map(s -> s.toLowerCase()) // Convert to lowercase for natural flow
                .collect(Collectors.toList());
        
        if (topStrengths.size() == 1) {
            strengths.append("My key strength lies in ").append(topStrengths.get(0))
                    .append(". This capability positions me well for professional success and allows me to contribute meaningfully to any organization.");
        } else if (topStrengths.size() == 2) {
            strengths.append("I excel in ").append(topStrengths.get(0))
                    .append(" and ").append(topStrengths.get(1))
                    .append(". These core competencies enable me to deliver high-quality results and drive meaningful impact in professional environments.");
        } else {
            strengths.append("My key strengths include ").append(topStrengths.get(0));
            for (int i = 1; i < topStrengths.size() - 1; i++) {
                strengths.append(", ").append(topStrengths.get(i));
            }
            strengths.append(", and ").append(topStrengths.get(topStrengths.size() - 1))
                    .append(". These diverse capabilities allow me to approach challenges from multiple angles and contribute effectively across various domains.");
        }
        
        return strengths.toString();
    }
    
    private String extractPersonalitySnippetFirstPerson(PsychometricReport report) {
        StringBuilder snippet = new StringBuilder();
        List<String> traits = new ArrayList<>();
        
        // Identify top personality traits
        if (report.getOpenness() != null && report.getOpenness() >= 70) {
            traits.add("highly creative and open to new experiences");
        }
        if (report.getConscientiousness() != null && report.getConscientiousness() >= 70) {
            traits.add("organized and detail-oriented");
        }
        if (report.getExtraversion() != null && report.getExtraversion() >= 70) {
            traits.add("energetic and sociable");
        }
        if (report.getAgreeableness() != null && report.getAgreeableness() >= 70) {
            traits.add("cooperative and empathetic");
        }
        if (report.getNeuroticism() != null && report.getNeuroticism() <= 30) {
            traits.add("emotionally stable and resilient");
        }
        
        if (!traits.isEmpty()) {
            snippet.append("I am ");
            if (traits.size() == 1) {
                snippet.append(traits.get(0));
            } else if (traits.size() == 2) {
                snippet.append(traits.get(0)).append(" and ").append(traits.get(1));
            } else {
                snippet.append(String.join(", ", traits.subList(0, traits.size() - 1)))
                       .append(", and ").append(traits.get(traits.size() - 1));
            }
            snippet.append(", which helps me thrive in dynamic professional environments.");
        }
        
        return snippet.toString();
    }
    
    private String extractPerformanceInsightFirstPerson(PsychometricReport report) {
        StringBuilder insight = new StringBuilder();
        
        if (report.getOverallScore() != null) {
            double score = report.getOverallScore();
            
            if (score >= 70) {
                insight.append("I achieved an overall score of ")
                        .append(String.format("%.1f", score))
                        .append("% in comprehensive psychometric assessments, demonstrating strong readiness for professional challenges");
            } else if (score >= 50) {
                insight.append("I scored ")
                        .append(String.format("%.1f", score))
                        .append("% overall in psychometric evaluations, showing solid foundational capabilities with clear potential for growth");
            } else {
                insight.append("My psychometric assessment results reflect developing capabilities across various competencies");
            }
            
            insight.append(".");
        }
        
        return insight.toString();
    }
    
    private String extractCareerGoalsFirstPerson(PsychometricReport report, UserInfo userInfo) {
        StringBuilder goals = new StringBuilder();
        
        if (userInfo != null && userInfo.getCareerInterest() != null) {
            goals.append("I am eager to apply my skills and knowledge in ")
                 .append(userInfo.getCareerInterest())
                 .append(" roles where I can make a meaningful impact");
            
            // Add context from opportunities if available
            if (report.getOpportunities() != null && !report.getOpportunities().isEmpty()) {
                String firstOpp = report.getOpportunities().get(0).toLowerCase();
                if (firstOpp.length() > 100) {
                    firstOpp = firstOpp.substring(0, 100) + "...";
                }
                goals.append(" and continue developing professionally through ")
                     .append(firstOpp);
            } else {
                goals.append(", contribute to organizational success, and continue learning and growing in my field");
            }
            
            goals.append(".");
        }
        
        return goals.toString();
    }
}

