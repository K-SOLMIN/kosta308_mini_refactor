package com.kimdoolim.blockperiod.service;

import com.kimdoolim.blockperiod.dao.BlockPeriodDao;
import com.kimdoolim.blockperiod.dao.BlockPeriodDetailDao;
import com.kimdoolim.dto.BlockPeriod;
import com.kimdoolim.dto.BlockPeriodDetail;
import com.kimdoolim.dto.Permission;
import com.kimdoolim.dto.User;

import java.sql.Connection;
import java.util.*;

import static com.kimdoolim.common.Mysql.*;

public class BlockPeriodService {

    private static final BlockPeriodService instance = new BlockPeriodService();
    private BlockPeriodService() {}
    public static BlockPeriodService getInstance() { return instance; }

    private final BlockPeriodDao       blockPeriodDao       = BlockPeriodDao.getInstance();
    private final BlockPeriodDetailDao blockPeriodDetailDao = BlockPeriodDetailDao.getInstance();

    // ── 전체 조회 (대상 목록 eager load) ───────────────────────────
    public List<BlockPeriod> getAllBlockPeriods() {
        Connection conn = getConnection();
        try {
            List<BlockPeriod> list = blockPeriodDao.findAll(conn);
            if (list == null) return Collections.emptyList();

            Map<Long, List<BlockPeriodDetail>> detailMap = blockPeriodDetailDao.findAllGrouped(conn);
            for (BlockPeriod bp : list) {
                bp.setDetails(detailMap.getOrDefault(bp.getBlockPeriodId(), Collections.emptyList()));
            }
            return list;
        } finally {
            close(conn);
        }
    }

    // ── 제한 일정 등록 ───────────────────────────────────────────────
    public boolean registerBlockPeriod(BlockPeriod bp) {
        Connection conn = getConnection();
        try {
            long newId = blockPeriodDao.save(conn, bp);
            if (newId <= 0) { rollback(conn); return false; }

            commit(conn);
            return true;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 제한 일정 수정 (ADMIN only) ──────────────────────────────────
    public boolean modifyBlockPeriod(BlockPeriod bp, User loginUser) {
        if (loginUser.getPermission() != Permission.ADMIN) return false;
        Connection conn = getConnection();
        try {
            int result = blockPeriodDao.update(conn, bp);
            if (result <= 0) { rollback(conn); return false; }
            commit(conn);
            return true;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 제한 일정 삭제 (소프트, ADMIN only) ─────────────────────────
    public boolean removeBlockPeriod(long blockPeriodId, User loginUser) {
        if (loginUser.getPermission() != Permission.ADMIN) return false;
        Connection conn = getConnection();
        try {
            // 대상 레코드 하드 삭제 후 부모 소프트 삭제
            blockPeriodDetailDao.deleteAllByBlockPeriodId(conn, blockPeriodId);
            int result = blockPeriodDao.softDelete(conn, blockPeriodId);
            if (result <= 0) { rollback(conn); return false; }
            commit(conn);
            return true;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 대상 추가 (ADMIN only) ───────────────────────────────────────
    public BlockPeriodDetail addDetail(long blockPeriodId, String targetType, long targetId, User loginUser) {
        if (loginUser.getPermission() != Permission.ADMIN) return null;
        Connection conn = getConnection();
        try {
            // 존재 확인
            if (blockPeriodDao.findById(conn, blockPeriodId) == null) { rollback(conn); return null; }

            BlockPeriodDetail detail = blockPeriodDetailDao.save(conn, blockPeriodId, targetType, targetId);
            if (detail != null) { commit(conn); return detail; }
            rollback(conn);
            return null;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    // ── 대상 삭제 (ADMIN only) ───────────────────────────────────────
    public boolean removeDetail(long blockPeriodDetailId, User loginUser) {
        if (loginUser.getPermission() != Permission.ADMIN) return false;
        Connection conn = getConnection();
        try {
            int result = blockPeriodDetailDao.delete(conn, blockPeriodDetailId);
            if (result > 0) { commit(conn); return true; }
            rollback(conn);
            return false;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }
}
