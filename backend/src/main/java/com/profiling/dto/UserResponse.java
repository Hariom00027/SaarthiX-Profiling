package com.profiling.dto;

public class UserResponse {
    private String id;
    private String email;
    private String name;
    private String provider;
    private String role;

    public UserResponse() {
    }

    public UserResponse(String id, String email, String name, String provider, String role) {
        this.id = id;
        this.email = email;
        this.name = name;
        this.provider = provider;
        this.role = role;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getProvider() {
        return provider;
    }

    public void setProvider(String provider) {
        this.provider = provider;
    }

    public String getRole() {
        return role;
    }

    public void setRole(String role) {
        this.role = role;
    }
}







