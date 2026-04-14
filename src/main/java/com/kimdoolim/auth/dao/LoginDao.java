package com.kimdoolim.auth.dao;

import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;
import com.kimdoolim.dto.UserStatus;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class LoginDao {

    public User findByIdAndPassword(Connection conn, String id, String password) {
        String sql = "SELECT user_id, school_id, id, permission, name, phone, " +
                     "grade_no, class_no, is_active, user_status " +
                     "FROM USER WHERE id = ? AND password = ?";

        try (PreparedStatement pstmt = conn.prepareStatement(sql)) {
            pstmt.setString(1, id);
            pstmt.setString(2, password);
            try (ResultSet rs = pstmt.executeQuery()) {
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
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    public List<User> findMiddleAdmins(Connection conn) {
        String sql = "SELECT user_id, name FROM USER WHERE permission IN ('MIDDLEADMIN', 'ADMIN') AND is_active = 1";
        List<User> list = new ArrayList<>();
        try (PreparedStatement pstmt = conn.prepareStatement(sql);
             ResultSet rs = pstmt.executeQuery()) {
            while (rs.next()) {
                list.add(User.builder()
                        .userId(rs.getInt("user_id"))
                        .name(rs.getString("name"))
                        .build());
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        return list;
    }
}
