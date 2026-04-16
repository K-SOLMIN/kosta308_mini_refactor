package com.kimdoolim.equipment.dao;

import com.kimdoolim.dto.Equipment;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EquipmentDao {

    private static final EquipmentDao instance = new EquipmentDao();
    private EquipmentDao() {}
    public static EquipmentDao getInstance() { return instance; }

    public List<Equipment> findAll(Connection conn) {
        String sql =
            "SELECT e.equipment_id, e.facility_id, e.manager_id, " +
            "       u.name AS manager_name, f.name AS facility_name, " +
            "       e.name, e.location, e.serial_no, e.status, e.check_delete " +
            "FROM EQUIPMENT e " +
            "LEFT JOIN USER u     ON e.manager_id  = u.user_id " +
            "LEFT JOIN FACILITY f ON e.facility_id = f.facility_id " +
            "WHERE e.check_delete = 'false' " +
            "ORDER BY e.equipment_id";

        List<Equipment> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                long facId  = rs.getLong("facility_id");
                int  mgrId  = rs.getInt("manager_id");
                list.add(Equipment.builder()
                    .equipmentId(rs.getLong("equipment_id"))
                    .facilityId(rs.wasNull() ? null : facId)
                    .managerId(rs.wasNull()  ? null : mgrId)
                    .managerName(rs.getString("manager_name"))
                    .facilityName(rs.getString("facility_name"))
                    .name(rs.getString("name"))
                    .location(rs.getString("location"))
                    .serialNo(rs.getString("serial_no"))
                    .status(rs.getString("status"))
                    .checkDelete("false")
                    .build());
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        return list;
    }

    public int save(Connection conn, Equipment eq) {
        String sql =
            "INSERT INTO EQUIPMENT " +
            "(facility_id, manager_id, name, location, serial_no, status, check_delete) " +
            "VALUES (?, ?, ?, ?, ?, ?, 'false')";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            setNullableLong(ps,    1, eq.getFacilityId());
            setNullableInt(ps,     2, eq.getManagerId());
            ps.setString(3, eq.getName());
            ps.setString(4, eq.getLocation());
            ps.setString(5, eq.getSerialNo());
            ps.setString(6, eq.getStatus());
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    public int update(Connection conn, Equipment eq) {
        String sql =
            "UPDATE EQUIPMENT SET " +
            "facility_id = ?, manager_id = ?, name = ?, " +
            "location = ?, serial_no = ?, status = ? " +
            "WHERE equipment_id = ?";

        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            setNullableLong(ps, 1, eq.getFacilityId());
            setNullableInt(ps,  2, eq.getManagerId());
            ps.setString(3, eq.getName());
            ps.setString(4, eq.getLocation());
            ps.setString(5, eq.getSerialNo());
            ps.setString(6, eq.getStatus());
            ps.setLong(7, eq.getEquipmentId());
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    public int softDelete(Connection conn, long equipmentId) {
        String sql = "UPDATE EQUIPMENT SET check_delete = 'true', deletedate = NOW() WHERE equipment_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, equipmentId);
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

    private void setNullableLong(PreparedStatement ps, int idx, Long value) throws SQLException {
        if (value == null) ps.setNull(idx, Types.BIGINT);
        else               ps.setLong(idx, value);
    }
}
