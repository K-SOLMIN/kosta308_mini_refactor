package com.kimdoolim.facility.dao;

import com.kimdoolim.dto.Facility;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class FacilityDao {

    public List<Facility> findAll(Connection conn) {
        String sql =
            "SELECT f.facility_id, f.manager_id, u.name AS manager_name, " +
            "       f.location, f.name, f.max_capacity, " +
            "       f.max_reservation_unit, f.max_reservation_value, f.status " +
            "FROM FACILITY f " +
            "LEFT JOIN USER u ON f.manager_id = u.user_id " +
            "WHERE f.is_delete = 0 " +
            "ORDER BY f.facility_id";

        List<Facility> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
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
        } catch (SQLException e) {
            e.printStackTrace();
            return null; // 에러 발생 시 null 반환
        }
        return list;
    }

    public int save(Connection conn, Facility f) {
        String sql =
            "INSERT INTO FACILITY " +
            "(manager_id, location, name, max_capacity, " +
            " max_reservation_unit, max_reservation_value, is_delete, status) " +
            "VALUES (?, ?, ?, ?, ?, ?, 0, ?)";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            setNullableInt(ps, 1, f.getManagerId());
            ps.setString(2, f.getLocation());
            ps.setString(3, f.getName());
            ps.setInt(4, f.getMaxCapacity());
            ps.setString(5, f.getMaxReservationUnit());
            ps.setInt(6, f.getMaxReservationValue());
            ps.setString(7, f.getStatus());
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1; // 에러 발생 시 -1 반환
        }
    }

    public int update(Connection conn, Facility f) {
        String sql =
            "UPDATE FACILITY SET " +
            "manager_id = ?, location = ?, name = ?, " +
            "max_capacity = ?, max_reservation_unit = ?, " +
            "max_reservation_value = ?, status = ? " +
            "WHERE facility_id = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            setNullableInt(ps, 1, f.getManagerId());
            ps.setString(2, f.getLocation());
            ps.setString(3, f.getName());
            ps.setInt(4, f.getMaxCapacity());
            ps.setString(5, f.getMaxReservationUnit());
            ps.setInt(6, f.getMaxReservationValue());
            ps.setString(7, f.getStatus());
            ps.setLong(8, f.getFacilityId());
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    public int softDelete(Connection conn, long facilityId) {
        String sql = "UPDATE FACILITY SET is_delete = 1, delete_date = NOW() WHERE facility_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, facilityId);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    private void setNullableInt(PreparedStatement ps, int idx, Integer value) throws SQLException {
        if (value == null) ps.setNull(idx, Types.INTEGER);
        else               ps.setInt(idx, value);
    }
}
