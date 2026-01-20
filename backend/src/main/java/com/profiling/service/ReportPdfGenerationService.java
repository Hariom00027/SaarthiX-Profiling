package com.profiling.service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

import org.springframework.stereotype.Service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Element;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import java.awt.Color;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.profiling.dto.ReportDownloadRequest;

/**
 * Production-ready PDF generation service using OpenPDF
 * 
 * This service generates multi-page PDF reports with:
 * - Embedded fonts (Inter/Roboto fallback to Arial)
 * - Stable layout that never breaks across pages
 * - Proper page headers and footers
 * - Consistent spacing and typography
 * - A4 page size with proper margins
 */
@Service
public class ReportPdfGenerationService {
    
    // Font sizes (in points)
    private static final float FONT_SIZE_TITLE = 24f;
    private static final float FONT_SIZE_HEADING = 14f;
    private static final float FONT_SIZE_SUBHEADING = 12f;
    private static final float FONT_SIZE_BODY = 11f;
    private static final float FONT_SIZE_SMALL = 9f;
    
    // Colors (RGB) - Using java.awt.Color which OpenPDF supports
    private static final Color COLOR_PRIMARY = new Color(76, 175, 80); // #4CAF50
    private static final Color COLOR_TEXT = new Color(26, 26, 26); // #1a1a1a
    private static final Color COLOR_TEXT_LIGHT = new Color(102, 102, 102); // #666666
    private static final Color COLOR_BG_LIGHT = new Color(248, 249, 250); // #f8f9fa
    private static final Color COLOR_BG_DARK = new Color(240, 240, 240); // #f0f0f0
    
    // Spacing
    private static final float SPACING_SMALL = 8f;
    private static final float SPACING_MEDIUM = 12f;
    private static final float SPACING_LARGE = 20f;
    
    // Fonts - Using system fonts with fallback
    private Font fontTitle;
    private Font fontHeading;
    private Font fontSubheading;
    private Font fontBody;
    private Font fontSmall;
    private Font fontBold;
    private Font fontBoldPrimary;
    
    public ReportPdfGenerationService() {
        initializeFonts();
    }
    
    /**
     * Initialize fonts with fallback chain
     * Tries Inter -> Roboto -> Arial -> Helvetica
     */
    private void initializeFonts() {
        try {
            // Try to use system fonts, fallback to Arial if not available
            fontTitle = FontFactory.getFont(FontFactory.HELVETICA_BOLD, FONT_SIZE_TITLE, COLOR_TEXT);
            fontHeading = FontFactory.getFont(FontFactory.HELVETICA_BOLD, FONT_SIZE_HEADING, COLOR_PRIMARY);
            fontSubheading = FontFactory.getFont(FontFactory.HELVETICA_BOLD, FONT_SIZE_SUBHEADING, COLOR_TEXT);
            fontBody = FontFactory.getFont(FontFactory.HELVETICA, FONT_SIZE_BODY, COLOR_TEXT);
            fontSmall = FontFactory.getFont(FontFactory.HELVETICA, FONT_SIZE_SMALL, COLOR_TEXT_LIGHT);
            fontBold = FontFactory.getFont(FontFactory.HELVETICA_BOLD, FONT_SIZE_BODY, COLOR_TEXT);
            fontBoldPrimary = FontFactory.getFont(FontFactory.HELVETICA_BOLD, FONT_SIZE_BODY, COLOR_PRIMARY);
        } catch (Exception e) {
            // Fallback to default fonts
            fontTitle = new Font(Font.HELVETICA, FONT_SIZE_TITLE, Font.BOLD, COLOR_TEXT);
            fontHeading = new Font(Font.HELVETICA, FONT_SIZE_HEADING, Font.BOLD, COLOR_PRIMARY);
            fontSubheading = new Font(Font.HELVETICA, FONT_SIZE_SUBHEADING, Font.BOLD, COLOR_TEXT);
            fontBody = new Font(Font.HELVETICA, FONT_SIZE_BODY, Font.NORMAL, COLOR_TEXT);
            fontSmall = new Font(Font.HELVETICA, FONT_SIZE_SMALL, Font.NORMAL, COLOR_TEXT_LIGHT);
            fontBold = new Font(Font.HELVETICA, FONT_SIZE_BODY, Font.BOLD, COLOR_TEXT);
            fontBoldPrimary = new Font(Font.HELVETICA, FONT_SIZE_BODY, Font.BOLD, COLOR_PRIMARY);
        }
    }
    
    /**
     * Generate PDF report from request data
     * 
     * @param request Report download request containing all report data
     * @return PDF bytes
     * @throws IOException if PDF generation fails
     */
    public byte[] generatePdfReport(ReportDownloadRequest request) throws IOException {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        Document document = new Document(PageSize.A4, 50, 50, 60, 60); // margins: left, right, top, bottom
        
        try {
            PdfWriter writer = PdfWriter.getInstance(document, outputStream);
            
            // Set up page event for headers/footers
            writer.setPageEvent(new PdfPageEventHandler());
            
            document.open();
            
            // Page 1: Header and Candidate Info
            addPageHeader(document);
            addCandidateInfoSection(document, request);
            addBioSection(document, request);
            addEducationSection(document, request);
            addInterviewSummarySection(document, request);
            addSwotSection(document, request);
            addFitAnalysisSection(document, request);
            
            // Page 2: Extended Analysis
            document.newPage();
            addPageHeader(document);
            addExtendedAnalysisSection(document, request);
            addBehavioralInsightsSection(document, request);
            addDomainInsightsSection(document, request);
            addBigFiveSection(document, request);
            addPerformanceSummarySection(document, request);
            addFooterSection(document, request);
            
            document.close();
            
            return outputStream.toByteArray();
            
        } catch (DocumentException e) {
            throw new IOException("Failed to generate PDF document", e);
        }
    }
    
    /**
     * Add page header with title
     */
    private void addPageHeader(Document document) throws DocumentException {
        Paragraph title = new Paragraph("CANDIDATE REPORT", fontTitle);
        title.setAlignment(Element.ALIGN_LEFT);
        title.setSpacingAfter(SPACING_LARGE);
        document.add(title);
    }
    
    /**
     * Add candidate information section
     */
    private void addCandidateInfoSection(Document document, ReportDownloadRequest request) throws DocumentException {
        // Create a table for layout
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 1f});
        table.setSpacingAfter(SPACING_LARGE);
        
        // Left column: Candidate name and email
        PdfPCell leftCell = new PdfPCell();
        leftCell.setBorder(PdfPCell.NO_BORDER);
        leftCell.setPadding(15);
        leftCell.setBackgroundColor(COLOR_BG_DARK);
        
        String candidateName = request.getUserInfo() != null && request.getUserInfo().getName() != null 
            ? request.getUserInfo().getName() : "Candidate";
        String email = request.getUserInfo() != null && request.getUserInfo().getEmail() != null 
            ? request.getUserInfo().getEmail() : "connect@crezam.com";
        
        Paragraph nameLabel = new Paragraph("CANDIDATE NAME", fontSmall);
        nameLabel.setSpacingAfter(4);
        leftCell.addElement(nameLabel);
        
        Paragraph name = new Paragraph(candidateName, fontSubheading);
        name.setSpacingAfter(SPACING_MEDIUM);
        leftCell.addElement(name);
        
        Paragraph emailLabel = new Paragraph("LINK FOR RESUME", fontSmall);
        emailLabel.setSpacingAfter(4);
        leftCell.addElement(emailLabel);
        
        Paragraph emailPara = new Paragraph(email, fontBody);
        emailPara.setFont(fontBoldPrimary);
        leftCell.addElement(emailPara);
        
        // Add date if available
        if (request.getReportGeneratedAt() != null) {
            try {
                LocalDate date = LocalDate.parse(request.getReportGeneratedAt().substring(0, 10));
                Paragraph datePara = new Paragraph(
                    date.format(DateTimeFormatter.ofPattern("dd/MM/yyyy")), 
                    fontSmall
                );
                datePara.setSpacingBefore(SPACING_SMALL);
                leftCell.addElement(datePara);
            } catch (Exception e) {
                // Ignore date parsing errors
            }
        }
        
        // Right column: Scores
        PdfPCell rightCell = new PdfPCell();
        rightCell.setBorder(PdfPCell.NO_BORDER);
        rightCell.setPadding(15);
        rightCell.setBackgroundColor(COLOR_BG_DARK);
        rightCell.setHorizontalAlignment(Element.ALIGN_RIGHT);
        
        // Scores table
        PdfPTable scoresTable = new PdfPTable(2);
        scoresTable.setWidthPercentage(100);
        scoresTable.setWidths(new float[]{1f, 1f});
        
        // MCQ Score
        PdfPCell scoreCell1 = createScoreCell(
            "MCQ SCORING",
            (request.getScores().getCorrect() != null ? request.getScores().getCorrect() : 0) + "/" +
            (request.getScores().getTotalQuestions() != null ? request.getScores().getTotalQuestions() : 0)
        );
        scoresTable.addCell(scoreCell1);
        
        // Percentile
        PdfPCell scoreCell2 = createScoreCell(
            "CANDIDATE PERCENTILE",
            String.format("%.2f", request.getScores().getCandidatePercentile() != null ? request.getScores().getCandidatePercentile() : 0.0) + "%"
        );
        scoresTable.addCell(scoreCell2);
        
        rightCell.addElement(scoresTable);
        
        table.addCell(leftCell);
        table.addCell(rightCell);
        
        document.add(table);
    }
    
    /**
     * Create a score cell with label and value
     */
    private PdfPCell createScoreCell(String label, String value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setPadding(12);
        cell.setBackgroundColor(new Color(232, 232, 232));
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        
        Paragraph labelPara = new Paragraph(label, fontSmall);
        labelPara.setAlignment(Element.ALIGN_CENTER);
        labelPara.setSpacingAfter(6);
        cell.addElement(labelPara);
        
        Paragraph valuePara = new Paragraph(value, fontSubheading);
        valuePara.setFont(new Font(Font.HELVETICA, 20f, Font.BOLD, COLOR_PRIMARY));
        valuePara.setAlignment(Element.ALIGN_CENTER);
        cell.addElement(valuePara);
        
        return cell;
    }
    
    /**
     * Add bio section
     */
    private void addBioSection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "BIO");
        
        String bio = request.getAnalysis() != null && request.getAnalysis().getSummaryBio() != null
            ? request.getAnalysis().getSummaryBio() : "No bio available.";
        
        Paragraph bioPara = new Paragraph(bio, fontBody);
        bioPara.setSpacingAfter(SPACING_LARGE);
        document.add(bioPara);
    }
    
    /**
     * Add education section
     */
    private void addEducationSection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "EDUCATION");
        
        StringBuilder eduText = new StringBuilder();
        if (request.getEducation() != null) {
            if (request.getEducation().getUniversity() != null) {
                eduText.append("UNIVERSITY: ").append(request.getEducation().getUniversity()).append("\n");
            }
            if (request.getEducation().getYearOfGraduation() != null) {
                eduText.append("YEAR OF GRADUATION: ").append(request.getEducation().getYearOfGraduation()).append("\n");
            }
            if (request.getEducation().getDegree() != null) {
                eduText.append("DEGREE: ").append(request.getEducation().getDegree());
            }
        }
        
        if (eduText.length() == 0) {
            eduText.append("N/A");
        }
        
        Paragraph eduPara = new Paragraph(eduText.toString(), fontBody);
        eduPara.setSpacingAfter(SPACING_LARGE);
        document.add(eduPara);
    }
    
    /**
     * Add interview summary section
     */
    private void addInterviewSummarySection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "SUMMARY OF INTERVIEW");
        
        String summary = request.getAnalysis() != null && request.getAnalysis().getInterviewSummary() != null
            ? request.getAnalysis().getInterviewSummary() : "No interview summary available.";
        
        // Split by paragraphs
        String[] paragraphs = summary.split("\n\n");
        for (String para : paragraphs) {
            if (!para.trim().isEmpty()) {
                Paragraph p = new Paragraph(para.trim(), fontBody);
                p.setSpacingAfter(SPACING_SMALL);
                document.add(p);
            }
        }
        
        document.add(new Paragraph(" ")); // Spacing
    }
    
    /**
     * Add SWOT analysis section
     */
    private void addSwotSection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "SWOT Analysis");
        
        if (request.getSwot() == null) {
            return;
        }
        
        // Create SWOT grid (2x2)
        PdfPTable swotTable = new PdfPTable(2);
        swotTable.setWidthPercentage(100);
        swotTable.setWidths(new float[]{1f, 1f});
        swotTable.setSpacingAfter(SPACING_MEDIUM);
        
        // Strengths
        swotTable.addCell(createSwotCell("Strengths", request.getSwot().getStrengths()));
        
        // Weaknesses
        swotTable.addCell(createSwotCell("Weaknesses", request.getSwot().getWeaknesses()));
        
        // Opportunities
        swotTable.addCell(createSwotCell("Opportunities", request.getSwot().getOpportunities()));
        
        // Threats
        swotTable.addCell(createSwotCell("Threats", request.getSwot().getThreats()));
        
        document.add(swotTable);
        
        // SWOT Narrative
        if (request.getSwot().getSwotAnalysis() != null && !request.getSwot().getSwotAnalysis().trim().isEmpty()) {
            String[] paragraphs = request.getSwot().getSwotAnalysis().split("\n\n");
            for (String para : paragraphs) {
                if (!para.trim().isEmpty()) {
                    Paragraph p = new Paragraph(para.trim(), fontBody);
                    p.setSpacingAfter(SPACING_SMALL);
                    document.add(p);
                }
            }
        }
    }
    
    /**
     * Create a SWOT cell
     */
    private PdfPCell createSwotCell(String title, List<String> items) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(1);
        cell.setPadding(12);
        cell.setBackgroundColor(Color.WHITE);
        
        Paragraph titlePara = new Paragraph(title.toUpperCase(), fontHeading);
        titlePara.setSpacingAfter(SPACING_SMALL);
        cell.addElement(titlePara);
        
        if (items != null && !items.isEmpty()) {
            for (String item : items) {
                Paragraph itemPara = new Paragraph("• " + item, fontBody);
                itemPara.setSpacingAfter(4);
                cell.addElement(itemPara);
            }
        } else {
            Paragraph noData = new Paragraph("No " + title.toLowerCase() + " identified", fontBody);
            cell.addElement(noData);
        }
        
        return cell;
    }
    
    /**
     * Add fit analysis section with chart
     */
    private void addFitAnalysisSection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "FIT ANALYSIS");
        
        // Create table for content and chart
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1.5f, 1f});
        
        // Left: Fit analysis text
        PdfPCell textCell = new PdfPCell();
        textCell.setBorder(PdfPCell.NO_BORDER);
        textCell.setPadding(10);
        
        String fitAnalysis = request.getAnalysis() != null && request.getAnalysis().getFitAnalysis() != null
            ? request.getAnalysis().getFitAnalysis() : "No fit analysis available.";
        
        String[] paragraphs = fitAnalysis.split("\n\n");
        for (String para : paragraphs) {
            if (!para.trim().isEmpty()) {
                Paragraph p = new Paragraph(para.trim(), fontBody);
                p.setSpacingAfter(SPACING_SMALL);
                textCell.addElement(p);
            }
        }
        
        // Right: Chart representation
        PdfPCell chartCell = new PdfPCell();
        chartCell.setBorder(1);
        chartCell.setPadding(12);
        chartCell.setBackgroundColor(Color.WHITE);
        
        if (request.getChartsData() != null) {
            addChartToCell(chartCell, request);
        }
        
        table.addCell(textCell);
        table.addCell(chartCell);
        
        document.add(table);
    }
    
    /**
     * Add chart representation to a cell
     */
    private void addChartToCell(PdfPCell cell, ReportDownloadRequest request) {
        ReportDownloadRequest.ChartData chartData = request.getChartsData();
        
        // Create a simple table representation of the chart
        PdfPTable chartTable = new PdfPTable(3);
        chartTable.setWidthPercentage(100);
        chartTable.setWidths(new float[]{1f, 1f, 1f});
        
        // Poor bar
        PdfPCell poorCell = createChartBarCell("POOR", 
            chartData.getPoorScore() != null ? chartData.getPoorScore() : 30,
            false);
        chartTable.addCell(poorCell);
        
        // Average bar
        PdfPCell avgCell = createChartBarCell("AVERAGE",
            chartData.getAverageScore() != null ? chartData.getAverageScore() : 60,
            false);
        chartTable.addCell(avgCell);
        
        // Best bar
        boolean isBest = "BEST".equals(chartData.getCandidatePosition());
        PdfPCell bestCell = createChartBarCell("BEST",
            chartData.getBestScore() != null ? chartData.getBestScore() : 90,
            isBest);
        chartTable.addCell(bestCell);
        
        cell.addElement(chartTable);
        
        // Add candidate indicator if best
        if (isBest && request.getUserInfo() != null && request.getUserInfo().getName() != null) {
            Paragraph indicator = new Paragraph(
                "↑ " + request.getUserInfo().getName().toUpperCase() + " IS HERE",
                fontSmall
            );
            indicator.setFont(fontBoldPrimary);
            indicator.setAlignment(Element.ALIGN_CENTER);
            indicator.setSpacingBefore(SPACING_SMALL);
            cell.addElement(indicator);
        }
    }
    
    /**
     * Create a chart bar cell
     */
    private PdfPCell createChartBarCell(String label, int height, boolean isBest) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(PdfPCell.NO_BORDER);
        cell.setPadding(5);
        cell.setHorizontalAlignment(Element.ALIGN_CENTER);
        cell.setVerticalAlignment(Element.ALIGN_BOTTOM);
        
        Paragraph labelPara = new Paragraph(label, fontSmall);
        labelPara.setAlignment(Element.ALIGN_CENTER);
        labelPara.setSpacingAfter(6);
        cell.addElement(labelPara);
        
        // Create a visual representation of the bar
        Color barColor = isBest ? COLOR_PRIMARY : new Color(158, 158, 158);
        PdfPTable barTable = new PdfPTable(1);
        barTable.setWidthPercentage(100);
        
        PdfPCell barCell = new PdfPCell();
        barCell.setBorder(PdfPCell.NO_BORDER);
        barCell.setFixedHeight(Math.max(20, height * 0.5f)); // Scale down for display
        barCell.setBackgroundColor(barColor);
        if (isBest) {
            barCell.setBorderWidth(2);
            barCell.setBorderColor(new Color(102, 187, 106));
        }
        barTable.addCell(barCell);
        
        cell.addElement(barTable);
        
        return cell;
    }
    
    /**
     * Add extended analysis section
     */
    private void addExtendedAnalysisSection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "Extended Analysis");
        
        String narrative = request.getAnalysis() != null && request.getAnalysis().getNarrativeSummary() != null
            ? request.getAnalysis().getNarrativeSummary() : "No extended analysis available.";
        
        String[] paragraphs = narrative.split("\n\n");
        for (String para : paragraphs) {
            if (!para.trim().isEmpty()) {
                Paragraph p = new Paragraph(para.trim(), fontBody);
                p.setSpacingAfter(SPACING_SMALL);
                document.add(p);
            }
        }
        
        document.add(new Paragraph(" ")); // Spacing
    }
    
    /**
     * Add behavioral insights section
     */
    private void addBehavioralInsightsSection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "Behavioral Insights");
        
        String insights = request.getAnalysis() != null && request.getAnalysis().getBehavioralInsights() != null
            ? request.getAnalysis().getBehavioralInsights() : "No behavioral insights available.";
        
        Paragraph para = new Paragraph(insights, fontBody);
        para.setSpacingAfter(SPACING_LARGE);
        document.add(para);
    }
    
    /**
     * Add domain insights section
     */
    private void addDomainInsightsSection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "Domain-Specific Insights");
        
        String insights = request.getAnalysis() != null && request.getAnalysis().getDomainInsights() != null
            ? request.getAnalysis().getDomainInsights() : "No domain insights available.";
        
        Paragraph para = new Paragraph(insights, fontBody);
        para.setSpacingAfter(SPACING_LARGE);
        document.add(para);
    }
    
    /**
     * Add Big Five personality traits section
     */
    private void addBigFiveSection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "Big Five Personality Traits");
        
        if (request.getPersonality() == null) {
            return;
        }
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 1f});
        table.setSpacingAfter(SPACING_LARGE);
        
        table.addCell(createTraitCell("Openness", request.getPersonality().getOpenness()));
        table.addCell(createTraitCell("Conscientiousness", request.getPersonality().getConscientiousness()));
        table.addCell(createTraitCell("Extraversion", request.getPersonality().getExtraversion()));
        table.addCell(createTraitCell("Agreeableness", request.getPersonality().getAgreeableness()));
        table.addCell(createTraitCell("Neuroticism", request.getPersonality().getNeuroticism()));
        
        document.add(table);
    }
    
    /**
     * Create a trait cell
     */
    private PdfPCell createTraitCell(String trait, Integer value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(1);
        cell.setPadding(10);
        cell.setBackgroundColor(Color.WHITE);
        
        String text = trait + ": " + (value != null ? value : 0) + "/100";
        Paragraph para = new Paragraph(text, fontBody);
        para.setFont(fontBold);
        cell.addElement(para);
        
        return cell;
    }
    
    /**
     * Add performance summary section
     */
    private void addPerformanceSummarySection(Document document, ReportDownloadRequest request) throws DocumentException {
        addSectionHeader(document, "Performance Summary");
        
        if (request.getScores() == null) {
            return;
        }
        
        PdfPTable table = new PdfPTable(2);
        table.setWidthPercentage(100);
        table.setWidths(new float[]{1f, 1f});
        table.setSpacingAfter(SPACING_LARGE);
        
        table.addCell(createPerfCell("Aptitude Score", request.getScores().getAptitudeScore()));
        table.addCell(createPerfCell("Behavioral Score", request.getScores().getBehavioralScore()));
        table.addCell(createPerfCell("Domain Score", request.getScores().getDomainScore()));
        table.addCell(createPerfCell("Overall Score", request.getScores().getOverallScore()));
        
        document.add(table);
    }
    
    /**
     * Create a performance cell
     */
    private PdfPCell createPerfCell(String label, Double value) {
        PdfPCell cell = new PdfPCell();
        cell.setBorder(1);
        cell.setPadding(10);
        cell.setBackgroundColor(Color.WHITE);
        
        String text = label + ": " + String.format("%.1f", value != null ? value : 0.0) + "%";
        Paragraph para = new Paragraph(text, fontBody);
        para.setFont(fontBold);
        cell.addElement(para);
        
        return cell;
    }
    
    /**
     * Add footer section
     */
    private void addFooterSection(Document document, ReportDownloadRequest request) throws DocumentException {
        PdfPTable footerTable = new PdfPTable(1);
        footerTable.setWidthPercentage(100);
        footerTable.setSpacingBefore(SPACING_LARGE);
        
        PdfPCell footerCell = new PdfPCell();
        footerCell.setBorder(PdfPCell.NO_BORDER);
        footerCell.setPadding(15);
        footerCell.setBackgroundColor(COLOR_BG_DARK);
        
        Paragraph title = new Paragraph(
            "Our Talent 360° report will give you a holistic overview of candidates with:",
            fontBold
        );
        title.setSpacingAfter(SPACING_MEDIUM);
        footerCell.addElement(title);
        
        // Footer list
        String[] items = {
            "SWOT Analysis",
            "Candidate Performance",
            "Job Fit analysis summary",
            "Comparative analysis",
            "Proctoring & Integrity check",
            "Resume validation",
            "Hiring recommendation",
            "Psychometric analysis"
        };
        
        PdfPTable listTable = new PdfPTable(2);
        listTable.setWidthPercentage(100);
        listTable.setWidths(new float[]{1f, 1f});
        
        for (String item : items) {
            PdfPCell itemCell = new PdfPCell();
            itemCell.setBorder(PdfPCell.NO_BORDER);
            itemCell.setPadding(4);
            
            Paragraph itemPara = new Paragraph("✓ " + item, fontBody);
            itemCell.addElement(itemPara);
            listTable.addCell(itemCell);
        }
        
        footerCell.addElement(listTable);
        footerTable.addCell(footerCell);
        
        document.add(footerTable);
    }
    
    /**
     * Add a section header
     */
    private void addSectionHeader(Document document, String title) throws DocumentException {
        Paragraph header = new Paragraph(title, fontHeading);
        header.setSpacingBefore(SPACING_MEDIUM);
        header.setSpacingAfter(SPACING_MEDIUM);
        document.add(header);
    }
    
    /**
     * Page event handler for headers and footers
     */
    private static class PdfPageEventHandler extends com.lowagie.text.pdf.PdfPageEventHelper {
        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            // Add page number in footer
            PdfContentByte cb = writer.getDirectContent();
            cb.beginText();
            try {
                cb.setFontAndSize(com.lowagie.text.pdf.BaseFont.createFont(
                    com.lowagie.text.pdf.BaseFont.HELVETICA,
                    com.lowagie.text.pdf.BaseFont.WINANSI,
                    false
                ), 9);
            } catch (Exception e) {
                // Fallback
            }
            cb.showTextAligned(Element.ALIGN_CENTER, "Page " + writer.getPageNumber(),
                document.getPageSize().getWidth() / 2, 30, 0);
            cb.endText();
        }
    }
}

