package com.kimdoolim.auth.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.common.Mysql;
import com.kimdoolim.dto.User;
import java.sql.Connection;

public class LoginService {

    private final LoginDao loginDao = new LoginDao();

    public User login(String id, String password) {
        if (id == null || id.isBlank() || password == null || password.isBlank()) {
            return null;
        }
        
        Connection conn = Mysql.getConnection();
        User user = loginDao.findByIdAndPassword(conn, id, password);
        Mysql.close(conn);
        
        return user;
    }
}
