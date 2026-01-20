package com.profiling.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.profiling.dto.psychometric.CheatEventRequest;
import com.profiling.dto.psychometric.SubmitTestRequest;
import com.profiling.dto.psychometric.SubmitTestResponse;
import com.profiling.service.psychometric.PsychometricSessionService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/test")
@Validated
public class PsychometricTestController {

    private final PsychometricSessionService sessionService;

    public PsychometricTestController(PsychometricSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @PostMapping("/submit")
    public ResponseEntity<SubmitTestResponse> submitTest(
            @Valid @RequestBody SubmitTestRequest request) {
        SubmitTestResponse response = sessionService.submitTest(request);
        return ResponseEntity.status(HttpStatus.OK).body(response);
    }

    @PostMapping("/log-cheat-event")
    public ResponseEntity<Void> logCheatEvent(
            @Valid @RequestBody CheatEventRequest request) {
        sessionService.logCheatEvent(request);
        return ResponseEntity.status(HttpStatus.OK).build();
    }
}


