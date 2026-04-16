package com.kimdoolim.auth.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.dto.User;
import java.sql.Connection;

import static com.kimdoolim.common.Mysql.*;

public class LoginService {

    private static final LoginService instance = new LoginService();
    private LoginService() {}
    public static LoginService getInstance() { return instance; }

    private final LoginDao loginDao = LoginDao.getInstance();

    public User login(String id, String password) {
        if (id == null || id.isBlank() || password == null || password.isBlank()) {
            return null;
        }
        
        Connection conn = getConnection();
        try {
            return loginDao.findByIdAndPassword(conn, id, password);
        } finally {
            close(conn);
        }
    }
}
