package com.profiling.service.psychometric;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import com.profiling.model.psychometric.PsychometricReport;
import com.profiling.model.psychometric.UserInfo;

@Service
public class PdfReportService {
    
    /**
     * Generate a 2-page PDF report from PsychometricReport
     */
    public byte[] generatePdfReport(PsychometricReport report) throws IOException {
        String htmlContent = generateHtmlReport(report);
        
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.useFastMode();
        builder.withHtmlContent(htmlContent, null);
        builder.toStream(outputStream);
        builder.run();
        
        return outputStream.toByteArray();
    }
    
    private String generateHtmlReport(PsychometricReport report) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html>\n");
        html.append("<html>\n");
        html.append("<head>\n");
        html.append("<meta charset='UTF-8'>\n");
        html.append("<style>\n");
        html.append(getReportStyles());
        html.append("</style>\n");
        html.append("</head>\n");
        html.append("<body>\n");
        
        // Page 1
        html.append("<div class='page'>\n");
        html.append(generatePage1Content(report));
        html.append("</div>\n");
        
        // Page 2
        html.append("<div class='page'>\n");
        html.append(generatePage2Content(report));
        html.append("</div>\n");
        
        html.append("</body>\n");
        html.append("</html>\n");
        
        return html.toString();
    }
    
    private String generatePage1Content(PsychometricReport report) {
        StringBuilder content = new StringBuilder();
        UserInfo userInfo = report.getUserInfo();
        
        // Header
        content.append("<div class='header'>\n");
        content.append("<h1 class='report-title'>CANDIDATE REPORT</h1>\n");
        content.append("</div>\n");
        
        // Candidate Info Section
        content.append("<div class='candidate-info-section'>\n");
        content.append("<div class='candidate-info-left'>\n");
        content.append("<div class='candidate-name-section'>\n");
        content.append("<div class='candidate-label'>CANDIDATE NAME</div>\n");
        content.append("<h2 class='candidate-name'>").append(escapeHtml(userInfo.getName())).append("</h2>\n");
        content.append("</div>\n");
        content.append("<div class='resume-link-section'>\n");
        content.append("<div class='resume-label'>EMAIL</div>\n");
        String email = userInfo.getEmail() != null ? userInfo.getEmail() : "connect@crezam.com";
        content.append("<div class='email-text'>").append(escapeHtml(email)).append("</div>\n");
        content.append("</div>\n");
        if (report.getReportGeneratedAt() != null) {
            String formattedDate = report.getReportGeneratedAt()
                .atZone(ZoneId.systemDefault())
                .format(DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            content.append("<div class='report-date'>").append(formattedDate).append("</div>\n");
        }
        content.append("</div>\n");
        
        // Scores Section
        content.append("<div class='candidate-info-right'>\n");
        content.append("<div class='scores-section'>\n");
        content.append("<div class='score-box'>\n");
        content.append("<div class='score-label'>MCQ SCORING</div>\n");
        content.append("<div class='score-value'>").append(report.getCorrect()).append("/").append(report.getTotalQuestions()).append("</div>\n");
        content.append("</div>\n");
        content.append("<div class='score-box'>\n");
        content.append("<div class='score-label'>CANDIDATE PERCENTILE</div>\n");
        content.append("<div class='score-value'>").append(String.format("%.2f", report.getCandidatePercentile())).append("%</div>\n");
        content.append("</div>\n");
        content.append("</div>\n");
        content.append("<div class='progress-bar-section'>\n");
        content.append("<div class='progress-bar-container'>\n");
        double percentile = report.getCandidatePercentile() != null ? report.getCandidatePercentile() : 0.0;
        content.append("<div class='progress-bar-fill' style='width: ").append(String.format("%.2f", percentile)).append("%;'></div>\n");
        content.append("</div>\n");
        content.append("<div class='progress-text'>").append(String.format("%.2f", percentile)).append("/100</div>\n");
        content.append("</div>\n");
        content.append("</div>\n");
        content.append("</div>\n");
        
        // Bio Section
        content.append("<div class='section'>\n");
        content.append("<h3>BIO</h3>\n");
        content.append("<p class='section-description'>This section provides a comprehensive overview of the candidate's professional background, educational qualifications, career aspirations, and personal interests.</p>\n");
        if (report.getSummaryBio() != null && !report.getSummaryBio().isEmpty()) {
            content.append("<div class='bio-content'><p>").append(escapeHtml(report.getSummaryBio())).append("</p></div>\n");
        } else {
            content.append("<div class='bio-content'>\n");
            if (userInfo.getCareerInterest() != null) {
                content.append("<p><strong>Career Interest:</strong> ").append(escapeHtml(userInfo.getCareerInterest())).append("</p>\n");
            }
            if (userInfo.getDegree() != null) {
                String degreeText = userInfo.getDegree();
                if (userInfo.getSpecialization() != null) {
                    degreeText += " in " + userInfo.getSpecialization();
                }
                content.append("<p><strong>Education:</strong> ").append(escapeHtml(degreeText)).append("</p>\n");
            }
            if (userInfo.getTechnicalSkills() != null) {
                content.append("<p><strong>Technical Skills:</strong> ").append(escapeHtml(userInfo.getTechnicalSkills())).append("</p>\n");
            }
            if (userInfo.getSoftSkills() != null) {
                content.append("<p><strong>Soft Skills:</strong> ").append(escapeHtml(userInfo.getSoftSkills())).append("</p>\n");
            }
            if (userInfo.getHobbies() != null) {
                content.append("<p><strong>Hobbies:</strong> ").append(escapeHtml(userInfo.getHobbies())).append("</p>\n");
            }
            if (userInfo.getInterests() != null) {
                content.append("<p><strong>Interests:</strong> ").append(escapeHtml(userInfo.getInterests())).append("</p>\n");
            }
            content.append("</div>\n");
        }
        content.append("</div>\n");
        
        // Education Section
        content.append("<div class='section'>\n");
        content.append("<h3>EDUCATION</h3>\n");
        content.append("<p class='section-description'>This section details the candidate's academic qualifications, including their degree, specialization, and educational institution.</p>\n");
        if (report.getUniversity() != null) {
            content.append("<p><strong>UNIVERSITY:</strong> ").append(escapeHtml(report.getUniversity())).append("</p>\n");
        }
        if (report.getYearOfGraduation() != null) {
            content.append("<p><strong>YEAR OF GRADUATION:</strong> ").append(report.getYearOfGraduation()).append("</p>\n");
        }
        if (userInfo.getDegree() != null) {
            content.append("<p><strong>DEGREE:</strong> ").append(escapeHtml(userInfo.getDegree())).append("</p>\n");
        }
        if (userInfo.getSpecialization() != null) {
            content.append("<p><strong>SPECIALIZATION:</strong> ").append(escapeHtml(userInfo.getSpecialization())).append("</p>\n");
        }
        content.append("</div>\n");
        
        // Psychometric Test Summary Section
        content.append("<div class='section'>\n");
        content.append("<h3>SUMMARY OF PSYCHOMETRIC TEST</h3>\n");
        content.append("<p class='section-description'>This section provides a comprehensive analysis of the candidate's performance across all sections of the psychometric assessment, including aptitude, behavioral, and domain-specific evaluations.</p>\n");
        content.append("<div class='interview-content'>").append(formatParagraphs(escapeHtml(report.getInterviewSummary()))).append("</div>\n");
        content.append("</div>\n");
        
        // SWOT Analysis Section
        content.append("<div class='section swot-section'>\n");
        content.append("<h3>SWOT Analysis</h3>\n");
        content.append("<p class='section-description'>SWOT (Strengths, Weaknesses, Opportunities, Threats) analysis provides a structured evaluation of the candidate's profile, identifying key areas of excellence, areas for improvement, potential growth opportunities, and external factors that may impact their career trajectory.</p>\n");
        content.append("<div class='swot-grid'>\n");
        
        content.append("<div class='swot-item'>\n");
        content.append("<h4>Strengths</h4>\n");
        content.append("<ul>\n");
        if (report.getStrengths() != null) {
            for (String strength : report.getStrengths()) {
                content.append("<li>").append(escapeHtml(strength)).append("</li>\n");
            }
        }
        content.append("</ul>\n");
        content.append("</div>\n");
        
        content.append("<div class='swot-item'>\n");
        content.append("<h4>Weaknesses</h4>\n");
        content.append("<ul>\n");
        if (report.getWeaknesses() != null) {
            for (String weakness : report.getWeaknesses()) {
                content.append("<li>").append(escapeHtml(weakness)).append("</li>\n");
            }
        }
        content.append("</ul>\n");
        content.append("</div>\n");
        
        content.append("<div class='swot-item'>\n");
        content.append("<h4>Opportunities</h4>\n");
        content.append("<ul>\n");
        if (report.getOpportunities() != null) {
            for (String opportunity : report.getOpportunities()) {
                content.append("<li>").append(escapeHtml(opportunity)).append("</li>\n");
            }
        }
        content.append("</ul>\n");
        content.append("</div>\n");
        
        content.append("<div class='swot-item'>\n");
        content.append("<h4>Threats</h4>\n");
        content.append("<ul>\n");
        if (report.getThreats() != null) {
            for (String threat : report.getThreats()) {
                content.append("<li>").append(escapeHtml(threat)).append("</li>\n");
            }
        }
        content.append("</ul>\n");
        content.append("</div>\n");
        
        content.append("</div>\n");
        
        // Detailed SWOT Analysis
        if (report.getSwotAnalysis() != null) {
            content.append("<div class='swot-narrative'>");
            content.append(formatParagraphs(escapeHtml(report.getSwotAnalysis())));
            content.append("</div>\n");
        }
        content.append("</div>\n");
        
        // Fit Analysis Section with Chart
        content.append("<div class='section fit-section'>\n");
        content.append("<h3>FIT ANALYSIS</h3>\n");
        content.append("<p class='section-description'>This analysis evaluates how well the candidate's skills, personality traits, and performance align with their chosen career path and the requirements of their field of interest.</p>\n");
        content.append("<div class='fit-content-wrapper'>\n");
        if (report.getFitAnalysis() != null) {
            content.append("<div class='fit-content'>");
            content.append(formatParagraphs(escapeHtml(report.getFitAnalysis())));
            content.append("</div>\n");
        }
        
        // Performance Chart
        if (report.getChartsData() != null) {
            content.append(generatePerformanceChart(report));
        }
        content.append("</div>\n");
        content.append("</div>\n");
        
        return content.toString();
    }
    
    private String generatePage2Content(PsychometricReport report) {
        StringBuilder content = new StringBuilder();
        
        // Extended Analysis Section
        content.append("<div class='section'>\n");
        content.append("<h3>Extended Analysis</h3>\n");
        content.append("<p class='section-description'>This section provides an in-depth narrative analysis of the candidate's overall profile, synthesizing performance metrics, personality traits, and behavioral patterns into a comprehensive assessment.</p>\n");
        if (report.getNarrativeSummary() != null) {
            content.append("<div class='narrative'>");
            content.append(formatParagraphs(escapeHtml(report.getNarrativeSummary())));
            content.append("</div>\n");
        }
        content.append("</div>\n");
        
        // Behavioral Insights
        content.append("<div class='section'>\n");
        content.append("<h3>Behavioral Insights</h3>\n");
        content.append("<p class='section-description'>This section analyzes the candidate's behavioral patterns, personality traits, and interpersonal skills based on their responses to behavioral assessment questions.</p>\n");
        if (report.getBehavioralInsights() != null) {
            content.append("<p>").append(escapeHtml(report.getBehavioralInsights())).append("</p>\n");
        }
        content.append("</div>\n");
        
        // Domain Insights
        content.append("<div class='section'>\n");
        content.append("<h3>Domain-Specific Insights</h3>\n");
        content.append("<p class='section-description'>This section provides specialized insights into the candidate's knowledge and performance in their specific domain or field of expertise, based on domain-specific assessment questions.</p>\n");
        if (report.getDomainInsights() != null) {
            content.append("<p>").append(escapeHtml(report.getDomainInsights())).append("</p>\n");
        }
        content.append("</div>\n");
        
        // Big Five Personality Traits
        content.append("<div class='section'>\n");
        content.append("<h3>Big Five Personality Traits</h3>\n");
        content.append("<p class='section-description'>The Big Five personality model evaluates five core dimensions of personality: Openness to Experience, Conscientiousness, Extraversion, Agreeableness, and Neuroticism. Each trait is scored on a scale of 0-100, providing insights into the candidate's personality structure and behavioral tendencies.</p>\n");
        
        // Big Five Chart
        content.append("<div class='big-five-chart-container'>\n");
        content.append("<div class='big-five-chart'>\n");
        
        content.append("<div class='big-five-bar-group'>\n");
        content.append("<div class='big-five-bar-wrapper'>\n");
        content.append("<div class='big-five-bar' style='width: ").append(report.getOpenness()).append("%;'>\n");
        content.append("<span class='big-five-bar-value'>").append(report.getOpenness()).append("</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='big-five-bar-label'>Openness</div>\n");
        content.append("</div>\n");
        
        content.append("<div class='big-five-bar-group'>\n");
        content.append("<div class='big-five-bar-wrapper'>\n");
        content.append("<div class='big-five-bar' style='width: ").append(report.getConscientiousness()).append("%;'>\n");
        content.append("<span class='big-five-bar-value'>").append(report.getConscientiousness()).append("</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='big-five-bar-label'>Conscientiousness</div>\n");
        content.append("</div>\n");
        
        content.append("<div class='big-five-bar-group'>\n");
        content.append("<div class='big-five-bar-wrapper'>\n");
        content.append("<div class='big-five-bar' style='width: ").append(report.getExtraversion()).append("%;'>\n");
        content.append("<span class='big-five-bar-value'>").append(report.getExtraversion()).append("</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='big-five-bar-label'>Extraversion</div>\n");
        content.append("</div>\n");
        
        content.append("<div class='big-five-bar-group'>\n");
        content.append("<div class='big-five-bar-wrapper'>\n");
        content.append("<div class='big-five-bar' style='width: ").append(report.getAgreeableness()).append("%;'>\n");
        content.append("<span class='big-five-bar-value'>").append(report.getAgreeableness()).append("</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='big-five-bar-label'>Agreeableness</div>\n");
        content.append("</div>\n");
        
        content.append("<div class='big-five-bar-group'>\n");
        content.append("<div class='big-five-bar-wrapper'>\n");
        content.append("<div class='big-five-bar' style='width: ").append(report.getNeuroticism()).append("%;'>\n");
        content.append("<span class='big-five-bar-value'>").append(report.getNeuroticism()).append("</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='big-five-bar-label'>Neuroticism</div>\n");
        content.append("</div>\n");
        
        content.append("</div>\n");
        content.append("</div>\n");
        
        // Detailed Trait Descriptions
        content.append("<div class='big-five-details'>\n");
        
        content.append("<div class='trait-detail-item'>\n");
        content.append("<div class='trait-detail-header'>\n");
        content.append("<h4>Openness to Experience</h4>\n");
        content.append("<span class='trait-score'>").append(report.getOpenness()).append("/100</span>\n");
        content.append("</div>\n");
        content.append("<p class='trait-description'>Measures curiosity, creativity, and willingness to try new experiences. ");
        content.append(report.getOpenness() >= 70 ? 
            "High scorers are imaginative, adventurous, and intellectually curious, embracing new ideas and unconventional approaches." :
            report.getOpenness() >= 40 ?
            "Moderate scorers balance traditional and innovative approaches, showing selective openness to new experiences." :
            "Lower scorers prefer familiar routines, practical solutions, and conventional approaches to problems.");
        content.append("</p>\n");
        content.append("</div>\n");
        
        content.append("<div class='trait-detail-item'>\n");
        content.append("<div class='trait-detail-header'>\n");
        content.append("<h4>Conscientiousness</h4>\n");
        content.append("<span class='trait-score'>").append(report.getConscientiousness()).append("/100</span>\n");
        content.append("</div>\n");
        content.append("<p class='trait-description'>Reflects organization, dependability, and goal-directed behavior. ");
        content.append(report.getConscientiousness() >= 70 ?
            "High scorers are disciplined, thorough, and reliable, excelling at planning and following through on commitments." :
            report.getConscientiousness() >= 40 ?
            "Moderate scorers demonstrate reasonable organization and reliability, balancing structure with flexibility." :
            "Lower scorers tend to be more spontaneous and flexible, sometimes at the expense of organization and planning.");
        content.append("</p>\n");
        content.append("</div>\n");
        
        content.append("<div class='trait-detail-item'>\n");
        content.append("<div class='trait-detail-header'>\n");
        content.append("<h4>Extraversion</h4>\n");
        content.append("<span class='trait-score'>").append(report.getExtraversion()).append("/100</span>\n");
        content.append("</div>\n");
        content.append("<p class='trait-description'>Indicates sociability, assertiveness, and energy from social interactions. ");
        content.append(report.getExtraversion() >= 70 ?
            "High scorers are outgoing, energetic, and thrive in social settings, preferring teamwork and external stimulation." :
            report.getExtraversion() >= 40 ?
            "Moderate scorers (ambiverts) adapt well to both social and solitary situations, balancing interaction with reflection." :
            "Lower scorers (introverts) prefer quieter, more solitary activities and may excel in independent work requiring deep focus.");
        content.append("</p>\n");
        content.append("</div>\n");
        
        content.append("<div class='trait-detail-item'>\n");
        content.append("<div class='trait-detail-header'>\n");
        content.append("<h4>Agreeableness</h4>\n");
        content.append("<span class='trait-score'>").append(report.getAgreeableness()).append("/100</span>\n");
        content.append("</div>\n");
        content.append("<p class='trait-description'>Evaluates cooperation, compassion, and interpersonal harmony. ");
        content.append(report.getAgreeableness() >= 70 ?
            "High scorers are empathetic, cooperative, and prioritize maintaining positive relationships and team harmony." :
            report.getAgreeableness() >= 40 ?
            "Moderate scorers balance cooperation with assertiveness, showing both empathy and the ability to challenge when necessary." :
            "Lower scorers tend to be more competitive and direct, prioritizing objectivity and results over interpersonal harmony.");
        content.append("</p>\n");
        content.append("</div>\n");
        
        content.append("<div class='trait-detail-item'>\n");
        content.append("<div class='trait-detail-header'>\n");
        content.append("<h4>Neuroticism (Emotional Stability)</h4>\n");
        content.append("<span class='trait-score'>").append(report.getNeuroticism()).append("/100</span>\n");
        content.append("</div>\n");
        content.append("<p class='trait-description'>Measures emotional stability and stress resilience. ");
        content.append(report.getNeuroticism() >= 70 ?
            "High scorers may experience more frequent emotional fluctuations and stress sensitivity, which can drive careful risk assessment." :
            report.getNeuroticism() >= 40 ?
            "Moderate scorers show balanced emotional responses, with good stress management in most situations." :
            "Lower scorers demonstrate strong emotional stability, remaining calm and composed under pressure with excellent stress resilience.");
        content.append("</p>\n");
        content.append("</div>\n");
        
        content.append("</div>\n");
        content.append("</div>\n");
        
        // Performance Summary
        content.append("<div class='section'>\n");
        content.append("<h3>Performance Summary</h3>\n");
        content.append("<p class='section-description'>This section provides a quantitative overview of the candidate's performance across different assessment sections, including aptitude, behavioral, and domain-specific scores, along with the overall performance metric.</p>\n");
        
        // Performance Chart
        content.append("<div class='performance-chart-container'>\n");
        content.append("<div class='performance-chart'>\n");
        
        content.append("<div class='performance-bar-group'>\n");
        content.append("<div class='performance-bar-wrapper'>\n");
        content.append("<div class='performance-bar aptitude-bar' style='width: ").append(String.format("%.1f", report.getAptitudeScore())).append("%;'>\n");
        content.append("<span class='performance-bar-value'>").append(String.format("%.1f", report.getAptitudeScore())).append("%</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='performance-bar-label'>Aptitude Score</div>\n");
        content.append("</div>\n");
        
        content.append("<div class='performance-bar-group'>\n");
        content.append("<div class='performance-bar-wrapper'>\n");
        content.append("<div class='performance-bar behavioral-bar' style='width: ").append(String.format("%.1f", report.getBehavioralScore())).append("%;'>\n");
        content.append("<span class='performance-bar-value'>").append(String.format("%.1f", report.getBehavioralScore())).append("%</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='performance-bar-label'>Behavioral Score</div>\n");
        content.append("</div>\n");
        
        content.append("<div class='performance-bar-group'>\n");
        content.append("<div class='performance-bar-wrapper'>\n");
        content.append("<div class='performance-bar domain-bar' style='width: ").append(String.format("%.1f", report.getDomainScore())).append("%;'>\n");
        content.append("<span class='performance-bar-value'>").append(String.format("%.1f", report.getDomainScore())).append("%</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='performance-bar-label'>Domain Score</div>\n");
        content.append("</div>\n");
        
        content.append("<div class='performance-bar-group overall-bar-group'>\n");
        content.append("<div class='performance-bar-wrapper'>\n");
        content.append("<div class='performance-bar overall-bar' style='width: ").append(String.format("%.1f", report.getOverallScore())).append("%;'>\n");
        content.append("<span class='performance-bar-value'>").append(String.format("%.1f", report.getOverallScore())).append("%</span>\n");
        content.append("</div></div>\n");
        content.append("<div class='performance-bar-label'>Overall Score</div>\n");
        content.append("</div>\n");
        
        content.append("</div>\n");
        content.append("</div>\n");
        
        // Performance Details
        content.append("<div class='performance-details'>\n");
        
        content.append("<div class='performance-detail-item'>\n");
        content.append("<div class='performance-detail-header'>\n");
        content.append("<h4>Aptitude Score</h4>\n");
        content.append("<span class='performance-score'>").append(String.format("%.1f", report.getAptitudeScore())).append("%</span>\n");
        content.append("</div>\n");
        content.append("<p class='performance-description'>Measures cognitive abilities, problem-solving skills, and analytical thinking. This score reflects the candidate's capacity to understand complex concepts, apply logical reasoning, and solve quantitative and qualitative problems efficiently.</p>\n");
        content.append("</div>\n");
        
        content.append("<div class='performance-detail-item'>\n");
        content.append("<div class='performance-detail-header'>\n");
        content.append("<h4>Behavioral Score</h4>\n");
        content.append("<span class='performance-score'>").append(String.format("%.1f", report.getBehavioralScore())).append("%</span>\n");
        content.append("</div>\n");
        content.append("<p class='performance-description'>Evaluates interpersonal skills, emotional intelligence, and situational judgment. This score indicates how well the candidate handles workplace scenarios, demonstrates leadership, manages conflicts, and adapts to changing situations.</p>\n");
        content.append("</div>\n");
        
        content.append("<div class='performance-detail-item'>\n");
        content.append("<div class='performance-detail-header'>\n");
        content.append("<h4>Domain Score</h4>\n");
        content.append("<span class='performance-score'>").append(String.format("%.1f", report.getDomainScore())).append("%</span>\n");
        content.append("</div>\n");
        content.append("<p class='performance-description'>Assesses specialized knowledge and technical proficiency in the candidate's field of expertise. This score demonstrates the depth of understanding in domain-specific concepts, tools, and best practices relevant to their career path.</p>\n");
        content.append("</div>\n");
        
        content.append("<div class='performance-detail-item overall-detail'>\n");
        content.append("<div class='performance-detail-header'>\n");
        content.append("<h4>Overall Score</h4>\n");
        content.append("<span class='performance-score overall-score-highlight'>").append(String.format("%.1f", report.getOverallScore())).append("%</span>\n");
        content.append("</div>\n");
        content.append("<p class='performance-description'>Represents the comprehensive evaluation combining all assessment components. This composite score provides a holistic measure of the candidate's readiness and suitability for their chosen career path, taking into account cognitive abilities, behavioral competencies, and domain expertise.</p>\n");
        content.append("</div>\n");
        
        content.append("</div>\n");
        content.append("</div>\n");
        
        // Footer
        content.append("<div class='footer'>\n");
        content.append("<p><strong>Our Talent 360° report will give you a holistic overview of candidates with:</strong></p>\n");
        content.append("<ul class='footer-list'>\n");
        content.append("<li>SWOT Analysis</li>\n");
        content.append("<li>Candidate Performance</li>\n");
        content.append("<li>Job Fit analysis summary</li>\n");
        content.append("<li>Comparative analysis</li>\n");
        content.append("<li>Proctoring & Integrity check</li>\n");
        content.append("<li>Resume validation</li>\n");
        content.append("<li>Hiring recommendation</li>\n");
        content.append("<li>Psychometric analysis</li>\n");
        content.append("</ul>\n");
        content.append("</div>\n");
        
        return content.toString();
    }
    
    private String generatePerformanceChart(PsychometricReport report) {
        StringBuilder chart = new StringBuilder();
        PsychometricReport.ChartData chartData = report.getChartsData();
        String position = chartData.getCandidatePosition();
        
        chart.append("<div class='chart-container'>\n");
        chart.append("<div class='chart-bars'>\n");
        
        // Poor bar
        chart.append("<div class='chart-bar-group'>\n");
        chart.append("<div class='bar-label'>POOR</div>\n");
        chart.append("<div class='bar bar-poor' style='height: ").append(chartData.getPoorScore()).append("px;'></div>\n");
        chart.append("</div>\n");
        
        // Average bar
        chart.append("<div class='chart-bar-group'>\n");
        chart.append("<div class='bar-label'>AVERAGE</div>\n");
        chart.append("<div class='bar bar-average' style='height: ").append(chartData.getAverageScore()).append("px;'></div>\n");
        chart.append("</div>\n");
        
        // Best bar with indicator
        chart.append("<div class='chart-bar-group best-bar'>\n");
        chart.append("<div class='bar-label'>BEST</div>\n");
        String bestBarClass = "BEST".equals(position) ? "bar bar-best best" : "bar bar-best";
        chart.append("<div class='").append(bestBarClass).append("' style='height: ").append(chartData.getBestScore()).append("px;'></div>\n");
        if ("BEST".equals(position)) {
            chart.append("<div class='candidate-indicator-wrapper'>\n");
            chart.append("<div class='candidate-indicator-icon'>A</div>\n");
            chart.append("<div class='candidate-indicator'>\n");
            chart.append("<span class='candidate-indicator-arrow'>↑</span>\n");
            chart.append(report.getUserInfo().getName().toUpperCase()).append(" IS HERE\n");
            chart.append("</div>\n");
            chart.append("</div>\n");
        }
        chart.append("</div>\n");
        
        chart.append("</div>\n");
        chart.append("</div>\n");
        
        return chart.toString();
    }
    
    private String getReportStyles() {
        return """
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            body {
                font-family: Arial, sans-serif;
                background: #1a1a1a;
                color: #ffffff;
                padding: 20px;
            }
            .page {
                background: #1a1a1a;
                padding: 40px;
                margin-bottom: 20px;
                min-height: 800px;
                page-break-after: always;
            }
            .header {
                margin-bottom: 30px;
            }
            .report-title {
                font-size: 28px;
                font-weight: bold;
                color: #ffffff;
                margin-bottom: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .candidate-info-section {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 30px;
                margin-bottom: 30px;
                padding: 25px;
                background: #2a2a2a;
                border-radius: 8px;
            }
            .candidate-info-left {
                flex: 1;
            }
            .candidate-name-section {
                margin-bottom: 20px;
            }
            .candidate-label, .resume-label {
                font-size: 11px;
                color: #cccccc;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                font-weight: 600;
            }
            .candidate-name {
                font-size: 24px;
                font-weight: bold;
                color: #ffffff;
                margin: 0;
            }
            .resume-link-section {
                margin-bottom: 15px;
            }
            .resume-link {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                color: #4CAF50;
                text-decoration: none;
                font-size: 14px;
            }
            .resume-link-icon {
                font-size: 16px;
            }
            .email-text {
                color: #4CAF50;
                font-size: 14px;
                font-weight: 500;
            }
            .section-description {
                font-size: 13px;
                color: #b0b0b0;
                font-style: italic;
                margin-bottom: 15px;
                line-height: 1.6;
                padding-bottom: 10px;
                border-bottom: 1px solid #3a3a3a;
            }
            .bio-content {
                margin-top: 10px;
            }
            .report-date {
                font-size: 13px;
                color: #cccccc;
                margin-top: 10px;
            }
            .candidate-info-right {
                display: flex;
                flex-direction: column;
                gap: 20px;
                align-items: flex-end;
            }
            .scores-section {
                display: flex;
                gap: 15px;
            }
            .score-box {
                background: #3a3a3a;
                padding: 15px 20px;
                border-radius: 6px;
                text-align: center;
                min-width: 140px;
            }
            .score-label {
                font-size: 11px;
                color: #cccccc;
                margin-bottom: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                font-weight: 600;
            }
            .score-value {
                font-size: 24px;
                font-weight: bold;
                color: #4CAF50;
            }
            .progress-bar-section {
                display: flex;
                flex-direction: column;
                align-items: flex-end;
                gap: 8px;
                width: 100%;
                max-width: 300px;
            }
            .progress-bar-container {
                width: 100%;
                height: 8px;
                background: #3a3a3a;
                border-radius: 4px;
                overflow: hidden;
            }
            .progress-bar-fill {
                height: 100%;
                background: #4CAF50;
                border-radius: 4px;
            }
            .progress-text {
                font-size: 12px;
                color: #cccccc;
                font-weight: 600;
            }
            .section {
                margin-bottom: 25px;
                padding: 15px;
                background: #2a2a2a;
                border-radius: 5px;
            }
            .section h3 {
                font-size: 16px;
                margin-bottom: 10px;
                color: #4CAF50;
                text-transform: uppercase;
            }
            .section p {
                line-height: 1.6;
                margin: 10px 0;
            }
            .swot-section {
                margin-top: 20px;
            }
            .swot-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-bottom: 20px;
            }
            .swot-item {
                background: #1a1a1a;
                padding: 15px;
                border-radius: 5px;
            }
            .swot-item h4 {
                font-size: 14px;
                margin-bottom: 10px;
                color: #4CAF50;
            }
            .swot-item ul {
                list-style: none;
                padding-left: 0;
            }
            .swot-item li {
                padding: 5px 0;
                font-size: 13px;
            }
            .swot-item li:before {
                content: "• ";
                color: #4CAF50;
                font-weight: bold;
            }
            .swot-narrative {
                margin-top: 15px;
                padding: 15px;
                background: #1a1a1a;
                border-radius: 5px;
                line-height: 1.8;
            }
            .fit-section {
                position: relative;
            }
            .fit-content-wrapper {
                display: flex;
                gap: 30px;
                align-items: flex-start;
            }
            .fit-content {
                flex: 1;
                line-height: 1.8;
            }
            .fit-content p {
                margin: 10px 0;
                color: #e0e0e0;
            }
            .chart-container {
                flex-shrink: 0;
                width: 280px;
                padding: 15px;
                background: #1a1a1a;
                border-radius: 6px;
            }
            .chart-bars {
                display: flex;
                gap: 15px;
                align-items: flex-end;
                justify-content: center;
                height: 200px;
                position: relative;
            }
            .chart-bar-group {
                flex: 1;
                display: flex;
                flex-direction: column;
                align-items: center;
                position: relative;
            }
            .bar-label {
                font-size: 11px;
                color: #cccccc;
                margin-bottom: 10px;
                text-transform: uppercase;
                font-weight: 600;
                letter-spacing: 0.5px;
            }
            .bar {
                width: 100%;
                border-radius: 4px 4px 0 0;
                min-height: 20px;
            }
            .bar-poor {
                background: #3a3a3a;
            }
            .bar-average {
                background: #5a5a5a;
            }
            .bar-best {
                background: #4CAF50;
            }
            .bar.best {
                background: #4CAF50;
                border: 2px solid #66BB6A;
                box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
            }
            .candidate-indicator-wrapper {
                position: absolute;
                top: -50px;
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 5px;
            }
            .candidate-indicator-icon {
                width: 24px;
                height: 24px;
                border-radius: 50%;
                background: #4CAF50;
                color: #ffffff;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                font-weight: bold;
                border: 2px solid #66BB6A;
            }
            .candidate-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                gap: 2px;
                padding: 6px 10px;
                background: #4CAF50;
                color: #ffffff;
                border-radius: 4px;
                font-size: 10px;
                font-weight: bold;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                white-space: nowrap;
            }
            .candidate-indicator-arrow {
                font-size: 14px;
                line-height: 1;
            }
            .big-five-grid, .performance-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
                margin-top: 15px;
            }
            .trait-item, .perf-item {
                padding: 10px;
                background: #1a1a1a;
                border-radius: 5px;
            }
            .big-five-chart-container, .performance-chart-container {
                margin: 20px 0;
                padding: 20px;
                background: #1a1a1a;
                border-radius: 8px;
            }
            .big-five-chart, .performance-chart {
                display: flex;
                flex-direction: column;
                gap: 18px;
            }
            .big-five-bar-group, .performance-bar-group {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .overall-bar-group {
                padding-top: 12px;
                border-top: 2px solid #3a3a3a;
            }
            .big-five-bar-wrapper, .performance-bar-wrapper {
                width: 100%;
                height: 35px;
                background: #2a2a2a;
                border-radius: 5px;
                overflow: hidden;
                position: relative;
            }
            .big-five-bar, .performance-bar {
                height: 100%;
                border-radius: 5px;
                display: flex;
                align-items: center;
                justify-content: flex-end;
                padding-right: 10px;
                min-width: 50px;
            }
            .big-five-bar {
                background: linear-gradient(90deg, #4CAF50, #66BB6A);
            }
            .aptitude-bar {
                background: linear-gradient(90deg, #2196F3, #42A5F5);
            }
            .behavioral-bar {
                background: linear-gradient(90deg, #9C27B0, #BA68C8);
            }
            .domain-bar {
                background: linear-gradient(90deg, #FF9800, #FFB74D);
            }
            .overall-bar {
                background: linear-gradient(90deg, #4CAF50, #66BB6A);
            }
            .big-five-bar-value, .performance-bar-value {
                color: #ffffff;
                font-weight: 700;
                font-size: 13px;
            }
            .big-five-bar-label, .performance-bar-label {
                font-size: 12px;
                color: #cccccc;
                font-weight: 600;
                padding-left: 3px;
            }
            .big-five-details, .performance-details {
                margin-top: 20px;
                display: flex;
                flex-direction: column;
                gap: 12px;
            }
            .performance-details {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
            }
            .trait-detail-item, .performance-detail-item {
                padding: 12px;
                background: #1a1a1a;
                border-radius: 5px;
                border-left: 3px solid #4CAF50;
            }
            .performance-detail-item:nth-child(1) {
                border-left-color: #2196F3;
            }
            .performance-detail-item:nth-child(2) {
                border-left-color: #9C27B0;
            }
            .performance-detail-item:nth-child(3) {
                border-left-color: #FF9800;
            }
            .overall-detail {
                grid-column: 1 / -1;
                border-left-color: #4CAF50;
            }
            .trait-detail-header, .performance-detail-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 6px;
            }
            .trait-detail-header h4, .performance-detail-header h4 {
                font-size: 14px;
                font-weight: 600;
                color: #ffffff;
                margin: 0;
            }
            .trait-score, .performance-score {
                font-size: 14px;
                font-weight: 700;
                color: #4CAF50;
            }
            .overall-score-highlight {
                font-size: 16px;
                color: #4CAF50;
            }
            .trait-description, .performance-description {
                font-size: 12px;
                line-height: 1.6;
                color: #e0e0e0;
                margin: 0;
            }
            .footer {
                margin-top: 40px;
                padding: 20px;
                background: #2a2a2a;
                border-radius: 5px;
            }
            .footer-list {
                list-style: none;
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 10px;
                margin-top: 15px;
            }
            .footer-list li {
                padding: 5px 0;
            }
            .footer-list li:before {
                content: "✓ ";
                color: #4CAF50;
            }
            """;
    }
    
    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;")
                   .replace("'", "&#39;");
    }
    
    private String formatParagraphs(String text) {
        if (text == null) return "";
        String[] paragraphs = text.split("\n\n");
        StringBuilder result = new StringBuilder();
        for (String para : paragraphs) {
            if (!para.trim().isEmpty()) {
                result.append("<p>").append(para.trim()).append("</p>\n");
            }
        }
        return result.toString();
    }
}

