package com.kimdoolim.blockperiod.dao;

import com.kimdoolim.dto.BlockPeriod;

import java.sql.*;
import java.util.ArrayList;
import java.util.List;

public class BlockPeriodDao {

    private static final BlockPeriodDao instance = new BlockPeriodDao();
    private BlockPeriodDao() {}
    public static BlockPeriodDao getInstance() { return instance; }

    // ── 전체 조회 (삭제되지 않은 것, 대상 수 포함) ──────────────────
    public List<BlockPeriod> findAll(Connection conn) {
        String sql =
            "SELECT bp.block_period_id, bp.title, " +
            "       DATE_FORMAT(bp.start_datetime, '%Y-%m-%d %H:%i:%s') AS start_datetime, " +
            "       DATE_FORMAT(bp.end_datetime,   '%Y-%m-%d %H:%i:%s') AS end_datetime, " +
            "       DATE_FORMAT(bp.created_at,     '%Y-%m-%d %H:%i:%s') AS created_at, " +
            "       bp.check_delete " +
            "FROM block_period bp " +
            "WHERE bp.check_delete = 0 " +
            "ORDER BY bp.start_datetime DESC";

        List<BlockPeriod> list = new ArrayList<>();
        try (PreparedStatement ps = conn.prepareStatement(sql);
             ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                list.add(BlockPeriod.builder()
                    .blockPeriodId(rs.getLong("block_period_id"))
                    .title(rs.getString("title"))
                    .startDatetime(rs.getString("start_datetime"))
                    .endDatetime(rs.getString("end_datetime"))
                    .createdAt(rs.getString("created_at"))
                    .checkDelete(rs.getInt("check_delete") == 1)
                    .build());
            }
        } catch (SQLException e) {
            e.printStackTrace();
            return null;
        }
        return list;
    }

    // ── 단건 조회 (권한 검증용) ──────────────────────────────────────
    public BlockPeriod findById(Connection conn, long blockPeriodId) {
        String sql = "SELECT block_period_id FROM block_period WHERE block_period_id = ? AND check_delete = 0";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, blockPeriodId);
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return BlockPeriod.builder()
                        .blockPeriodId(rs.getLong("block_period_id"))
                        .build();
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
        return null;
    }

    // ── 등록 (생성된 PK 반환) ────────────────────────────────────────
    public long save(Connection conn, BlockPeriod bp) {
        String sql =
            "INSERT INTO block_period (title, start_datetime, end_datetime) VALUES (?, ?, ?)";
        try (PreparedStatement ps = conn.prepareStatement(sql, Statement.RETURN_GENERATED_KEYS)) {
            ps.setString(1, bp.getTitle());
            ps.setString(2, bp.getStartDatetime());
            ps.setString(3, bp.getEndDatetime());
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
    public int update(Connection conn, BlockPeriod bp) {
        String sql =
            "UPDATE block_period SET title = ?, start_datetime = ?, end_datetime = ? " +
            "WHERE block_period_id = ? AND check_delete = 0";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setString(1, bp.getTitle());
            ps.setString(2, bp.getStartDatetime());
            ps.setString(3, bp.getEndDatetime());
            ps.setLong(4, bp.getBlockPeriodId());
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }

    // ── 소프트 삭제 ──────────────────────────────────────────────────
    public int softDelete(Connection conn, long blockPeriodId) {
        String sql = "UPDATE block_period SET check_delete = 1, delete_date = NOW() WHERE block_period_id = ?";
        try (PreparedStatement ps = conn.prepareStatement(sql)) {
            ps.setLong(1, blockPeriodId);
            return ps.executeUpdate();
        } catch (SQLException e) {
            e.printStackTrace();
            return -1;
        }
    }
}
