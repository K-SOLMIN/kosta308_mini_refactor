package com.kimdoolim.blockperiod.dao;

import com.kimdoolim.dto.BlockPeriodDetail;

import java.sql.*;
import java.util.*;

public class BlockPeriodDetailDao {

    private static final BlockPeriodDetailDao instance = new BlockPeriodDetailDao();
    private BlockPeriodDetailDao() {}
    public static BlockPeriodDetailDao getInstance() { return instance; }

    // ── 전체 대상을 한 번에 조회 (blockPeriodId → List) ──────────────
    // FACILITY → FACILITY 테이블, EQUIPMENT → EQUIPMENT 테이블 LEFT JOIN
    public Map<Long, List<BlockPeriodDetail>> findAllGrouped(Connection conn) {
        String sql =
            "SELECT d.block_period_detail_id, d.block_period_id, d.target_type, d.target_id, " +
            "       COALESCE(f.name, e.name) AS target_name " +
            "FROM block_period_detail d " +
            "LEFT JOIN FACILITY   f ON d.target_type = 'FACILITY'  AND d.target_id = f.facility_id " +
            "LEFT JOIN EQUIPMENT  e ON d.target_type = 'EQUIPMENT' AND d.target_id = e.equipment_id " +
            "ORDER BY d.block_period_id, d.block_period_detail_id";

        Map<Long, List<BlockPeriodDetail>> map = new LinkedHashMap<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                long bpId = rs.getLong("block_period_id");
                map.computeIfAbsent(bpId, k -> new ArrayList<>()).add(
                    BlockPeriodDetail.builder()
                        .blockPeriodDetailId(rs.getLong("block_period_detail_id"))
                        .blockPeriodId(bpId)
                        .targetType(rs.getString("target_type"))
                        .targetId(rs.getLong("target_id"))
                        .targetName(rs.getString("target_name"))
                        .build()
                );
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return map;
    }

    // ── 특정 제한 일정의 대상 목록 조회 ─────────────────────────────
    public List<BlockPeriodDetail> findByBlockPeriodId(Connection conn, long blockPeriodId) {
        String sql =
            "SELECT d.block_period_detail_id, d.block_period_id, d.target_type, d.target_id, " +
            "       COALESCE(f.name, e.name) AS target_name " +
            "FROM block_period_detail d " +
            "LEFT JOIN FACILITY   f ON d.target_type = 'FACILITY'  AND d.target_id = f.facility_id " +
            "LEFT JOIN EQUIPMENT  e ON d.target_type = 'EQUIPMENT' AND d.target_id = e.equipment_id " +
            "WHERE d.block_period_id = ? " +
            "ORDER BY d.block_period_detail_id";

        List<BlockPeriodDetail> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, blockPeriodId);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    list.add(BlockPeriodDetail.builder()
                        .blockPeriodDetailId(rs.getLong("block_period_detail_id"))
                        .blockPeriodId(rs.getLong("block_period_id"))
                        .targetType(rs.getString("target_type"))
                        .targetId(rs.getLong("target_id"))
                        .targetName(rs.getString("target_name"))
                        .build());
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return list;
    }

    // ── 대상 1건 추가 ────────────────────────────────────────────────
    public BlockPeriodDetail save(Connection conn, long blockPeriodId, String targetType, long targetId) {
        String sql = "INSERT INTO block_period_detail (block_period_id, target_type, target_id) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setLong(1, blockPeriodId);
            ps.setString(2, targetType);
            ps.setLong(3, targetId);
            if (ps.executeUpdate() == 0) return null;
            try (ResultSet keys = ps.getGeneratedKeys()) {
                if (keys.next()) {
                    return BlockPeriodDetail.builder()
                        .blockPeriodDetailId(keys.getLong(1))
                        .blockPeriodId(blockPeriodId)
                        .targetType(targetType)
                        .targetId(targetId)
                        .build();
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // ── 대상 1건 삭제 (하드 삭제) ────────────────────────────────────
    public int delete(Connection conn, long blockPeriodDetailId) {
        String sql = "DELETE FROM block_period_detail WHERE block_period_detail_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, blockPeriodDetailId);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    // ── 제한 일정에 속한 대상 전체 삭제 (소프트삭제 전 정리용) ──────
    public int deleteAllByBlockPeriodId(Connection conn, long blockPeriodId) {
        String sql = "DELETE FROM block_period_detail WHERE block_period_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, blockPeriodId);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }
}
