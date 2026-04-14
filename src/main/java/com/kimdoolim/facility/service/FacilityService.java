package com.kimdoolim.facility.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.common.Mysql;
import com.kimdoolim.dto.Facility;
import com.kimdoolim.dto.User;
import com.kimdoolim.facility.dao.FacilityDao;

import java.sql.Connection;
import java.util.Collections;
import java.util.List;

public class FacilityService {

    private final FacilityDao facilityDao = new FacilityDao();
    private final LoginDao loginDao = new LoginDao();

    public List<Facility> getAllFacilities() {
        Connection conn = Mysql.getConnection();
        List<Facility> list = facilityDao.findAll(conn);
        if (list == null) list = Collections.emptyList();
        Mysql.close(conn);
        return list;
    }

    public List<User> getAvailableManagers() {
        Connection conn = Mysql.getConnection();
        List<User> list = loginDao.findMiddleAdmins(conn);
        if (list == null) list = Collections.emptyList();
        Mysql.close(conn);
        return list;
    }

    public boolean registerFacility(Facility facility) {
        Connection conn = Mysql.getConnection();
        int result = facilityDao.save(conn, facility);
        
        boolean success = false;
        if (result > 0) {
            Mysql.commit(conn);
            success = true;
        } else {
            Mysql.rollback(conn);
        }
        Mysql.close(conn);
        return success;
    }

    public boolean modifyFacility(Facility facility) {
        Connection conn = Mysql.getConnection();
        int result = facilityDao.update(conn, facility);
        
        boolean success = false;
        if (result > 0) {
            Mysql.commit(conn);
            success = true;
        } else {
            Mysql.rollback(conn);
        }
        Mysql.close(conn);
        return success;
    }

    public boolean removeFacility(long facilityId) {
        Connection conn = Mysql.getConnection();
        int result = facilityDao.softDelete(conn, facilityId);
        
        boolean success = false;
        if (result > 0) {
            Mysql.commit(conn);
            success = true;
        } else {
            Mysql.rollback(conn);
        }
        Mysql.close(conn);
        return success;
    }
}
