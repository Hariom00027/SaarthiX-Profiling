package com.profiling.dto.psychometric;

import com.profiling.model.psychometric.PsychometricSession;
import com.profiling.model.psychometric.SessionStatus;

public class SessionStatusResponse {
    private String status;
    private Progress progress;

    public static SessionStatusResponse from(PsychometricSession session) {
        SessionStatusResponse response = new SessionStatusResponse();
        // Map enum to string values as specified
        SessionStatus sessionStatus = session.getStatus();
        if (sessionStatus == SessionStatus.CREATED) {
            response.status = "CREATING";
        } else if (sessionStatus == SessionStatus.GENERATING) {
            response.status = "GENERATING";
        } else if (sessionStatus == SessionStatus.PARTIAL_READY) {
            // At least one section (typically aptitude) is ready, others may still be generating
            response.status = "PARTIAL_READY";
        } else if (sessionStatus == SessionStatus.READY) {
            response.status = "READY";
        } else if (sessionStatus == SessionStatus.FAILED) {
            response.status = "FAILED";
        } else {
            response.status = sessionStatus != null ? sessionStatus.name() : "CREATING";
        }
        response.progress = new Progress();
        response.progress.aptitude = session.isAptitudeReady();
        response.progress.behavioral = session.isBehavioralReady();
        response.progress.domain = session.isDomainReady();
        return response;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public Progress getProgress() {
        return progress;
    }

    public void setProgress(Progress progress) {
        this.progress = progress;
    }

    public static class Progress {
        private boolean aptitude;
        private boolean behavioral;
        private boolean domain;

        public boolean isAptitude() {
            return aptitude;
        }

        public void setAptitude(boolean aptitude) {
            this.aptitude = aptitude;
        }

        public boolean isBehavioral() {
            return behavioral;
        }

        public void setBehavioral(boolean behavioral) {
            this.behavioral = behavioral;
        }

        public boolean isDomain() {
            return domain;
        }

        public void setDomain(boolean domain) {
            this.domain = domain;
        }
    }
}


