package com.profiling.dto.psychometric;

import java.util.List;

import com.profiling.model.psychometric.PsychometricSession;
import com.profiling.model.psychometric.Question;
import com.profiling.model.psychometric.Report;
import com.profiling.model.psychometric.SessionStatus;
import com.profiling.model.psychometric.UserInfo;

public class PsychometricSessionResponse {
    private String id;
    private UserInfo userInfo;
    private SessionStatus status;
    private List<Question> questions;
    private Report report;

    public static PsychometricSessionResponse from(PsychometricSession session) {
        PsychometricSessionResponse response = new PsychometricSessionResponse();
        response.id = session.getId();
        response.userInfo = session.getUserInfo();
        response.status = session.getStatus();
        response.questions = session.getQuestions();
        response.report = session.getReport();
        return response;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public UserInfo getUserInfo() {
        return userInfo;
    }

    public void setUserInfo(UserInfo userInfo) {
        this.userInfo = userInfo;
    }

    public SessionStatus getStatus() {
        return status;
    }

    public void setStatus(SessionStatus status) {
        this.status = status;
    }

    public List<Question> getQuestions() {
        return questions;
    }

    public void setQuestions(List<Question> questions) {
        this.questions = questions;
    }

    public Report getReport() {
        return report;
    }

    public void setReport(Report report) {
        this.report = report;
    }
}





