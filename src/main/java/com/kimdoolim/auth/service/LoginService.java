package com.kimdoolim.auth.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.dto.User;

public class LoginService {

    private final LoginDao loginDao = new LoginDao();

    public User login(String id, String password) {
        if (id == null || id.isBlank() || password == null || password.isBlank()) {
            return null;
        }
        return loginDao.findByIdAndPassword(id, password);
    }
}
