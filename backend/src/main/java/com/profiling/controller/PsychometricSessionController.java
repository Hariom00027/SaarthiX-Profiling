package com.profiling.controller;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.profiling.dto.psychometric.CreateSessionRequest;
import com.profiling.dto.psychometric.CreateSessionResponse;
import com.profiling.dto.psychometric.PsychometricReportResponse;
import com.profiling.dto.psychometric.PsychometricSessionResponse;
import com.profiling.dto.psychometric.SessionStatusResponse;
import com.profiling.model.psychometric.PsychometricReport;
import com.profiling.model.psychometric.PsychometricSession;
import com.profiling.model.psychometric.Question;
import com.profiling.model.psychometric.SessionStatus;
import com.profiling.service.psychometric.AnswersPdfService;
import com.profiling.service.psychometric.PdfReportService;
import com.profiling.service.psychometric.ProfileFromReportService;
import com.profiling.service.psychometric.PsychometricSessionService;
import com.profiling.service.psychometric.ReportGenerationService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/psychometric/sessions")
@Validated
public class PsychometricSessionController {

    private final PsychometricSessionService sessionService;
    private final ReportGenerationService reportGenerationService;
    private final PdfReportService pdfReportService;
    private final AnswersPdfService answersPdfService;
    private final ProfileFromReportService profileFromReportService;

    public PsychometricSessionController(
            PsychometricSessionService sessionService,
            ReportGenerationService reportGenerationService,
            PdfReportService pdfReportService,
            AnswersPdfService answersPdfService,
            ProfileFromReportService profileFromReportService) {
        this.sessionService = sessionService;
        this.reportGenerationService = reportGenerationService;
        this.pdfReportService = pdfReportService;
        this.answersPdfService = answersPdfService;
        this.profileFromReportService = profileFromReportService;
    }

    @PostMapping
    public ResponseEntity<CreateSessionResponse> createSession(
            @Valid @RequestBody CreateSessionRequest request) {
        PsychometricSession session = sessionService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(new CreateSessionResponse(session.getId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PsychometricSessionResponse> getSession(@PathVariable String id) {
        return sessionService.getSession(id)
                .map(PsychometricSessionResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/status")
    public ResponseEntity<SessionStatusResponse> getSessionStatus(@PathVariable String id) {
        return sessionService.getSession(id)
                .map(SessionStatusResponse::from)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}/questions")
    public ResponseEntity<List<Question>> getSessionQuestions(@PathVariable String id) {
        return sessionService.getSession(id)
                // Always return whatever questions are currently available for this session.
                // The frontend uses SessionStatusResponse.progress flags to understand which
                // sections are ready and handles partial question sets gracefully.
                .map(session -> ResponseEntity.ok(session.getQuestions()))
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @PostMapping("/{sessionId}/generate-report")
    public ResponseEntity<PsychometricReportResponse> generateReport(@PathVariable String sessionId) {
        return sessionService.getSession(sessionId)
                .map(session -> {
                    PsychometricReport report = reportGenerationService.generateReport(session);
                    // Store report in session
                    session.setReport(convertToReportModel(report));
                    sessionService.saveSession(session);
                    return ResponseEntity.ok(PsychometricReportResponse.from(report));
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{sessionId}/report")
    public ResponseEntity<PsychometricReportResponse> getReport(@PathVariable String sessionId) {
        return sessionService.getSession(sessionId)
                .map(session -> {
                    if (session.getReport() == null) {
                        // Generate report if it doesn't exist
                        PsychometricReport report = reportGenerationService.generateReport(session);
                        session.setReport(convertToReportModel(report));
                        sessionService.saveSession(session);
                        return ResponseEntity.ok(PsychometricReportResponse.from(report));
                    } else {
                        // Convert stored report to response
                        PsychometricReport report = convertFromReportModel(session.getReport(), session);
                        return ResponseEntity.ok(PsychometricReportResponse.from(report));
                    }
                })
                .orElseGet(() -> ResponseEntity.notFound().build());
    }
    
    @GetMapping("/{sessionId}/report/pdf")
    public ResponseEntity<byte[]> getReportPdf(@PathVariable String sessionId) {
        Optional<PsychometricSession> sessionOpt = sessionService.getSession(sessionId);
        
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        PsychometricSession session = sessionOpt.get();
        try {
            PsychometricReport report;
            if (session.getReport() == null) {
                report = reportGenerationService.generateReport(session);
                session.setReport(convertToReportModel(report));
                sessionService.saveSession(session);
            } else {
                report = convertFromReportModel(session.getReport(), session);
            }
            
            byte[] pdfBytes = pdfReportService.generatePdfReport(report);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                "psychometric-report-" + sessionId + ".pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (IOException e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{sessionId}/answers/pdf")
    public ResponseEntity<byte[]> getAnswersPdf(@PathVariable String sessionId) {
        Optional<PsychometricSession> sessionOpt = sessionService.getSession(sessionId);
        
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        PsychometricSession session = sessionOpt.get();
        
        // Check if test is completed
        if (session.getStatus() != SessionStatus.COMPLETED) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        
        try {
            byte[] pdfBytes = answersPdfService.generateAnswersPdf(session);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", 
                "psychometric-answers-" + sessionId + ".pdf");
            
            return ResponseEntity.ok()
                    .headers(headers)
                    .body(pdfBytes);
        } catch (Exception e) {
            // Log the full error for debugging
            System.err.println("Error generating answers PDF for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    @GetMapping("/{sessionId}/generate-profile")
    public ResponseEntity<String> generateProfileFromReport(@PathVariable String sessionId) {
        Optional<PsychometricSession> sessionOpt = sessionService.getSession(sessionId);
        
        if (sessionOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        PsychometricSession session = sessionOpt.get();
        
        try {
            PsychometricReport report;
            if (session.getReport() == null) {
                report = reportGenerationService.generateReport(session);
                session.setReport(convertToReportModel(report));
                sessionService.saveSession(session);
            } else {
                report = convertFromReportModel(session.getReport(), session);
            }
            
            String profile = profileFromReportService.generateProfileFromReport(report);
            
            return ResponseEntity.ok(profile);
        } catch (Exception e) {
            System.err.println("Error generating profile from report for session " + sessionId + ": " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
    
    // Helper methods to convert between Report model and PsychometricReport
    private com.profiling.model.psychometric.Report convertToReportModel(PsychometricReport report) {
        com.profiling.model.psychometric.Report model = new com.profiling.model.psychometric.Report();
        model.setSummary(report.getNarrativeSummary());
        // Store other fields as needed - for now, just summary
        return model;
    }
    
    private PsychometricReport convertFromReportModel(com.profiling.model.psychometric.Report model, 
                                                      PsychometricSession session) {
        // If report exists, regenerate it to get full data
        // In a production system, you'd store the full report JSON
        return reportGenerationService.generateReport(session);
    }
}


