package com.kimdoolim.equipment.dao;

import com.kimdoolim.dto.Equipment;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EquipmentDao {

    private static final EquipmentDao instance = new EquipmentDao();
    private EquipmentDao() {}
    public static EquipmentDao getInstance() { return instance; }

    // ── 전체 조회 (낱개 집계 포함) ──────────────────────────────────
    public List<Equipment> findAll(Connection conn) {
        String sql =
            "SELECT e.equipment_id, e.facility_id, e.manager_id, " +
            "       u.name AS manager_name, f.name AS facility_name, " +
            "       e.name, e.location, e.serial_no, e.status, e.check_delete, " +
            "       COUNT(ed.equipment_detail_id)              AS detail_count, " +
            "       COALESCE(SUM(ed.status = '정상'), 0)       AS normal_count, " +
            "       COALESCE(SUM(ed.status != '정상'), 0)      AS issue_count " +
            "FROM EQUIPMENT e " +
            "LEFT JOIN USER u             ON e.manager_id  = u.user_id " +
            "LEFT JOIN FACILITY f         ON e.facility_id = f.facility_id " +
            "LEFT JOIN EQUIPMENTDETAIL ed ON e.equipment_id = ed.equipment_id AND ed.check_delete = 0 " +
            "WHERE e.check_delete = 0 " +
            "GROUP BY e.equipment_id, e.facility_id, e.manager_id, " +
            "         u.name, f.name, e.name, e.location, e.serial_no, e.status, e.check_delete " +
            "ORDER BY e.equipment_id";

        List<Equipment> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                long    facIdRaw = rs.getLong("facility_id");
                boolean facNull  = rs.wasNull();
                int     mgrIdRaw = rs.getInt("manager_id");
                boolean mgrNull  = rs.wasNull();

                list.add(Equipment.builder()
                    .equipmentId(rs.getLong("equipment_id"))
                    .facilityId(facNull ? null : facIdRaw)
                    .managerId(mgrNull  ? null : mgrIdRaw)
                    .managerName(rs.getString("manager_name"))
                    .facilityName(rs.getString("facility_name"))
                    .name(rs.getString("name"))
                    .location(rs.getString("location"))
                    .serialNo(rs.getString("serial_no"))
                    .status(rs.getString("status"))
                    .checkDelete(false)
                    .detailCount(rs.getInt("detail_count"))
                    .normalCount(rs.getInt("normal_count"))
                    .issueCount(rs.getInt("issue_count"))
                    .build());
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        return list;
    }

    // ── 등록 (생성된 PK 반환) ────────────────────────────────────────
    public long saveAndGetId(Connection conn, Equipment eq) {
        String sql =
            "INSERT INTO EQUIPMENT " +
            "(facility_id, manager_id, name, location, serial_no, status, check_delete) " +
            "VALUES (?, ?, ?, ?, ?, ?, 0)";

        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            setNullableLong(ps, 1, eq.getFacilityId());
            setNullableInt(ps,  2, eq.getManagerId());
            ps.setString(3, eq.getName());
            ps.setString(4, eq.getLocation());
            ps.setString(5, eq.getSerialNo());
            ps.setString(6, eq.getStatus());
            ps.executeUpdate();

            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) return keys.getLong(1);
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return -1;
    }

    // ── 수정 ────────────────────────────────────────────────────────
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

    // ── 소프트 삭제 ──────────────────────────────────────────────────
    public int softDelete(Connection conn, long equipmentId) {
        String sql = "UPDATE EQUIPMENT SET check_delete = 1, deletedate = NOW() WHERE equipment_id = ?";
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
