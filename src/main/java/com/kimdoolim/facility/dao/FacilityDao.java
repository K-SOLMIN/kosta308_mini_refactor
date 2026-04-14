package com.kimdoolim.facility.dao;

import com.kimdoolim.common.Mysql;
import com.kimdoolim.dto.Facility;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FacilityDao {

    // ── 전체 시설 조회 (담당자 LEFT JOIN) ──────────────────────────
    public List<Facility> findAll() {
        String sql =
            "SELECT f.facility_id, f.manager_id, u.name AS manager_name, " +
            "       f.location, f.name, f.max_capacity, " +
            "       f.max_reservation_unit, f.max_reservation_value, f.status " +
            "FROM facility f " +
            "LEFT JOIN user u ON f.manager_id = u.user_id " +
            "WHERE f.is_delete = 0 " +
            "ORDER BY f.facility_id";

        List<Facility> list = new ArrayList<>();
        Connection con = null;
        PreparedStatement ps = null;
        ResultSet rs = null;
        try {
            con = Mysql.getConnection();
            ps  = con.prepareStatement(sql);
            rs  = ps.executeQuery();
            while (rs.next()) {
                int mgrId = rs.getInt("manager_id");
                list.add(Facility.builder()
                    .facilityId(rs.getLong("facility_id"))
                    .managerId(rs.wasNull() ? null : mgrId)
                    .managerName(rs.getString("manager_name"))
                    .location(rs.getString("location"))
                    .name(rs.getString("name"))
                    .maxCapacity(rs.getInt("max_capacity"))
                    .maxReservationUnit(rs.getString("max_reservation_unit"))
                    .maxReservationValue(rs.getInt("max_reservation_value"))
                    .isDelete(false)
                    .status(rs.getString("status"))
                    .build());
            }
            Mysql.commit(con);
        } catch (SQLException e) {
            Mysql.rollback(con);
            e.printStackTrace();
        } finally {
            Mysql.close(rs, ps, con);
        }
        return list;
    }

    // ── 시설 등록 ──────────────────────────────────────────────────
    public boolean save(Facility f) {
        String sql =
            "INSERT INTO facility " +
            "(manager_id, location, name, max_capacity, " +
            " max_reservation_unit, max_reservation_value, is_delete, status) " +
            "VALUES (?, ?, ?, ?, ?, ?, 0, ?)";

        Connection con = null;
        PreparedStatement ps = null;
        try {
            con = Mysql.getConnection();
            ps  = con.prepareStatement(sql);
            setNullableInt(ps, 1, f.getManagerId());
            ps.setString(2, f.getLocation());
            ps.setString(3, f.getName());
            ps.setInt(4, f.getMaxCapacity());
            ps.setString(5, f.getMaxReservationUnit());
            ps.setInt(6, f.getMaxReservationValue());
            ps.setString(7, f.getStatus());
            int rows = ps.executeUpdate();
            Mysql.commit(con);
            return rows > 0;
        } catch (SQLException e) {
            Mysql.rollback(con);
            e.printStackTrace();
            return false;
        } finally {
            Mysql.close(ps, con);
        }
    }

    // ── 시설 수정 ──────────────────────────────────────────────────
    public boolean update(Facility f) {
        String sql =
            "UPDATE facility SET " +
            "manager_id = ?, location = ?, name = ?, " +
            "max_capacity = ?, max_reservation_unit = ?, " +
            "max_reservation_value = ?, status = ? " +
            "WHERE facility_id = ?";

        Connection con = null;
        PreparedStatement ps = null;
        try {
            con = Mysql.getConnection();
            ps  = con.prepareStatement(sql);
            setNullableInt(ps, 1, f.getManagerId());
            ps.setString(2, f.getLocation());
            ps.setString(3, f.getName());
            ps.setInt(4, f.getMaxCapacity());
            ps.setString(5, f.getMaxReservationUnit());
            ps.setInt(6, f.getMaxReservationValue());
            ps.setString(7, f.getStatus());
            ps.setLong(8, f.getFacilityId());
            int rows = ps.executeUpdate();
            Mysql.commit(con);
            return rows > 0;
        } catch (SQLException e) {
            Mysql.rollback(con);
            e.printStackTrace();
            return false;
        } finally {
            Mysql.close(ps, con);
        }
    }

    // ── 시설 삭제 (Soft Delete) ────────────────────────────────────
    public boolean softDelete(long facilityId) {
        String sql =
            "UPDATE facility SET is_delete = 1, delete_date = NOW() " +
            "WHERE facility_id = ?";

        Connection con = null;
        PreparedStatement ps = null;
        try {
            con = Mysql.getConnection();
            ps  = con.prepareStatement(sql);
            ps.setLong(1, facilityId);
            int rows = ps.executeUpdate();
            Mysql.commit(con);
            return rows > 0;
        } catch (SQLException e) {
            Mysql.rollback(con);
            e.printStackTrace();
            return false;
        } finally {
            Mysql.close(ps, con);
        }
    }

    private void setNullableInt(PreparedStatement ps, int idx, Integer value) throws SQLException {
        if (value == null) ps.setNull(idx, Types.INTEGER);
        else               ps.setInt(idx, value);
    }
}
