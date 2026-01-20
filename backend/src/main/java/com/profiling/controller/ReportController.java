package com.profiling.controller;

import java.io.IOException;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.profiling.dto.ReportDownloadRequest;
import com.profiling.service.ReportPdfGenerationService;

import jakarta.validation.Valid;

/**
 * Controller for PDF report generation
 * 
 * This controller handles the new backend PDF generation endpoint
 * that accepts JSON data and returns a PDF blob.
 */
@RestController
@RequestMapping("/api/report")
public class ReportController {
    
    private final ReportPdfGenerationService pdfGenerationService;
    
    public ReportController(ReportPdfGenerationService pdfGenerationService) {
        this.pdfGenerationService = pdfGenerationService;
    }
    
    /**
     * Generate and download PDF report
     * 
     * POST /api/report/download
     * 
     * Accepts JSON payload with report data and returns PDF bytes
     * 
     * @param request Report download request containing all report data
     * @return PDF bytes with proper headers for download
     */
    @PostMapping("/download")
    public ResponseEntity<byte[]> downloadReport(@Valid @RequestBody ReportDownloadRequest request) {
        try {
            // Generate PDF from request data
            byte[] pdfBytes = pdfGenerationService.generatePdfReport(request);
            
            // Set response headers for PDF download
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "psychometric-report.pdf");
            headers.setContentLength(pdfBytes.length);
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
                    
        } catch (IOException e) {
            // Log error (in production, use proper logging)
            System.err.println("Failed to generate PDF: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        } catch (Exception e) {
            // Handle any other errors
            System.err.println("Unexpected error during PDF generation: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
















