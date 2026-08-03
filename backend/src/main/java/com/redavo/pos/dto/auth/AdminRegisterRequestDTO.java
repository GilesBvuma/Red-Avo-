package com.redavo.pos.dto.auth;

import lombok.Data;

@Data
public class AdminRegisterRequestDTO {
    private String fullName;
    private String email;
    private String phoneNumber;
    private String password;
    private String confirmPassword;
    private String superPassword;
}
