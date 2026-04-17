package com.kimdoolim.auth.dao;

import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;
import com.kimdoolim.dto.UserStatus;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class LoginDao {

    private static final LoginDao instance = new LoginDao();
    private LoginDao() {}
    public static LoginDao getInstance() { return instance; }

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

    // ── 모든 활성 사용자 조회 (담당자 배정용) ───────────────────────
    public List<User> findAllActiveUsers(Connection conn) {
        String sql = "SELECT user_id, name, permission FROM USER WHERE is_active = 1 ORDER BY name";
        List<User> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(User.builder()
                        .userId(rs.getInt("user_id"))
                        .name(rs.getString("name"))
                        .permission(Permission.valueOf(rs.getString("permission")))
                        .build());
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        return list;
    }

    // ── USER → MIDDLEADMIN 권한 승격 (이미 MIDDLEADMIN/ADMIN이면 무시) ──
    public int updatePermissionToMiddleAdmin(Connection conn, int userId) {
        String sql = "UPDATE USER SET permission = 'MIDDLEADMIN' WHERE user_id = ? AND permission = 'USER'";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setInt(1, userId);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }
}
