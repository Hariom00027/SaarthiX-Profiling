package com.profiling.dto.psychometric;

import com.profiling.model.psychometric.UserInfo;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

public class CreateSessionRequest {

    @Valid
    @NotNull
    private UserInfo userInfo;

    public UserInfo getUserInfo() {
        return userInfo;
    }

    public void setUserInfo(UserInfo userInfo) {
        this.userInfo = userInfo;
    }
   
}


