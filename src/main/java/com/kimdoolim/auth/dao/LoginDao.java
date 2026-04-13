package com.kimdoolim.auth.dao;

import com.kimdoolim.common.Mysql;
import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;
import com.kimdoolim.dto.UserStatus;

import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class LoginDao {

    public User findByIdAndPassword(String id, String password) {
        String sql = "SELECT user_id, school_id, id, permission, name, phone, " +
                     "grade_no, class_no, is_active, user_status " +
                     "FROM USER WHERE id = ? AND password = ?";

        Connection conn = null;
        PreparedStatement pstmt = null;
        ResultSet rs = null;

        try {
            conn = Mysql.getConnection();
            pstmt = conn.prepareStatement(sql);
            pstmt.setString(1, id);
            pstmt.setString(2, password);
            rs = pstmt.executeQuery();

            if (rs.next()) {
                return User.builder()
                        .userId(rs.getInt("user_id"))
                        .schoolId(rs.getInt("school_id"))
                        .id(rs.getString("id"))
                        .permission(Permission.valueOf(rs.getString("permission")))
                        .name(rs.getString("name"))
                        .phone(rs.getString("phone"))
                        .gradeNo(rs.getInt("grade_no"))
                        .classNo(rs.getInt("class_no"))
                        .isActive(rs.getBoolean("is_active"))
                        .userStatus(UserStatus.valueOf(rs.getString("user_status")))
                        .build();
            }
        } catch (SQLException e) {
            e.printStackTrace();
        } finally {
            Mysql.close(rs, pstmt, conn);
        }
        return null;
    }
}
