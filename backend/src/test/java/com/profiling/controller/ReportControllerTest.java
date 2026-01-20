package com.profiling.controller;

import com.profiling.dto.ReportDownloadRequest;
import com.profiling.service.ReportPdfGenerationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReportController Tests")
class ReportControllerTest {

    @Mock
    private ReportPdfGenerationService pdfGenerationService;

    @InjectMocks
    private ReportController controller;

    private ReportDownloadRequest validRequest;

    @BeforeEach
    void setUp() {
        validRequest = new ReportDownloadRequest();
        // Set up valid request fields
    }

    @Test
    @DisplayName("downloadReport should return PDF bytes with valid request")
    void testDownloadReport_ValidRequest_ReturnsPdf() throws IOException {
        byte[] mockPdfBytes = "PDF content".getBytes();
        when(pdfGenerationService.generatePdfReport(any(ReportDownloadRequest.class)))
            .thenReturn(mockPdfBytes);

        ResponseEntity<byte[]> response = controller.downloadReport(validRequest);

        assertEquals(HttpStatus.OK, response.getStatusCode());
        assertNotNull(response.getBody());
        assertEquals("application/pdf", response.getHeaders().getContentType().toString());
        assertTrue(response.getHeaders().getContentDisposition().toString().contains("psychometric-report.pdf"));
        verify(pdfGenerationService).generatePdfReport(validRequest);
    }

    @Test
    @DisplayName("downloadReport should handle IOException")
    void testDownloadReport_IOException_ReturnsInternalServerError() throws IOException {
        when(pdfGenerationService.generatePdfReport(any(ReportDownloadRequest.class)))
            .thenThrow(new IOException("PDF generation failed"));

        ResponseEntity<byte[]> response = controller.downloadReport(validRequest);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }

    @Test
    @DisplayName("downloadReport should handle generic exception")
    void testDownloadReport_GenericException_ReturnsInternalServerError() throws IOException {
        when(pdfGenerationService.generatePdfReport(any(ReportDownloadRequest.class)))
            .thenThrow(new RuntimeException("Unexpected error"));

        ResponseEntity<byte[]> response = controller.downloadReport(validRequest);

        assertEquals(HttpStatus.INTERNAL_SERVER_ERROR, response.getStatusCode());
    }
}
