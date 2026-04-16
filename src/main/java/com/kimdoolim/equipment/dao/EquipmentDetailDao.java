package com.kimdoolim.equipment.dao;

import com.kimdoolim.dto.EquipmentDetail;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class EquipmentDetailDao {

    private static final EquipmentDetailDao instance = new EquipmentDetailDao();
    private EquipmentDetailDao() {}
    public static EquipmentDetailDao getInstance() { return instance; }

    // ── 특정 비품의 낱개 전체 조회 ───────────────────────────────────
    public List<EquipmentDetail> findByEquipmentId(Connection conn, long equipmentId) {
        String sql =
            "SELECT equipment_detail_id, equipment_id, serial_no, status, check_delete " +
            "FROM EQUIPMENTDETAIL " +
            "WHERE equipment_id = ? AND check_delete = 0 " +
            "ORDER BY equipment_detail_id";

        List<EquipmentDetail> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, equipmentId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(EquipmentDetail.builder()
                        .equipmentDetailId(rs.getLong("equipment_detail_id"))
                        .equipmentId(rs.getLong("equipment_id"))
                        .serialNo(rs.getString("serial_no"))
                        .status(rs.getString("status"))
                        .checkDelete(rs.getInt("check_delete") == 1)
                        .build());
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        return list;
    }

    // ── 낱개 일괄 등록 (세트 등록 시) ────────────────────────────────
    // serialPrefix + "-001", "-002" ... 형식으로 생성
    public int bulkSave(Connection conn, long equipmentId, String serialPrefix, int quantity) {
        String sql = "INSERT INTO EQUIPMENTDETAIL (equipment_id, serial_no, status, check_delete) VALUES (?, ?, '정상', 0)";
        int count = 0;
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            for (int i = 1; i <= quantity; i++) {
                String serial = serialPrefix + "-" + String.format("%03d", i);
                ps.setLong(1, equipmentId);
                ps.setString(2, serial);
                ps.addBatch();
            }
            int[] results = ps.executeBatch();
            for (int r : results) count += r;
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
        return count;
    }

    // ── 낱개 1건 추가 ────────────────────────────────────────────────
    public int save(Connection conn, long equipmentId, String serialNo) {
        String sql = "INSERT INTO EQUIPMENTDETAIL (equipment_id, serial_no, status, check_delete) VALUES (?, ?, '정상', 0)";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, equipmentId);
            ps.setString(2, serialNo);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    // ── 낱개 상태 변경 ───────────────────────────────────────────────
    public int updateStatus(Connection conn, long detailId, String status) {
        String sql = "UPDATE EQUIPMENTDETAIL SET status = ? WHERE equipment_detail_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, status);
            ps.setLong(2, detailId);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    // ── 낱개 소프트 삭제 ─────────────────────────────────────────────
    public int softDelete(Connection conn, long detailId) {
        String sql = "UPDATE EQUIPMENTDETAIL SET check_delete = 1, delete_date = NOW() WHERE equipment_detail_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, detailId);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }
}
