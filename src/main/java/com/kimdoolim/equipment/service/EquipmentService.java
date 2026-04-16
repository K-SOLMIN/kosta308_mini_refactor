package com.kimdoolim.equipment.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.dto.Equipment;
import com.kimdoolim.dto.User;
import com.kimdoolim.equipment.dao.EquipmentDao;

import java.sql.Connection;
import java.util.Collections;
import java.util.List;

import static com.kimdoolim.common.Mysql.*;

public class EquipmentService {

    private static final EquipmentService instance = new EquipmentService();
    private EquipmentService() {}
    public static EquipmentService getInstance() { return instance; }

    private final EquipmentDao equipmentDao = EquipmentDao.getInstance();
    private final LoginDao     loginDao     = LoginDao.getInstance();

    public List<Equipment> getAllEquipments() {
        Connection conn = getConnection();
        try {
            List<Equipment> list = equipmentDao.findAll(conn);
            return list != null ? list : Collections.emptyList();
        } finally {
            close(conn);
        }
    }

    public List<User> getAvailableManagers() {
        Connection conn = getConnection();
        try {
            List<User> list = loginDao.findMiddleAdmins(conn);
            return list != null ? list : Collections.emptyList();
        } finally {
            close(conn);
        }
    }

    public boolean registerEquipment(Equipment equipment) {
        Connection conn = getConnection();
        try {
            int result = equipmentDao.save(conn, equipment);
            if (result > 0) {
                commit(conn);
                return true;
            }
            rollback(conn);
            return false;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    public boolean modifyEquipment(Equipment equipment) {
        Connection conn = getConnection();
        try {
            int result = equipmentDao.update(conn, equipment);
            if (result > 0) {
                commit(conn);
                return true;
            }
            rollback(conn);
            return false;
        } catch (Exception e) {
            rollback(conn);
            throw e;
        } finally {
            close(conn);
        }
    }

    public boolean removeEquipment(long equipmentId) {
        Connection conn = getConnection();
        try {
            int result = equipmentDao.softDelete(conn, equipmentId);
            if (result > 0) {
                commit(conn);
                return true;
            }
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
