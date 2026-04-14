package com.kimdoolim.facility.service;

import com.kimdoolim.auth.dao.LoginDao;
import com.kimdoolim.dto.Facility;
import com.kimdoolim.dto.User;
import com.kimdoolim.facility.dao.FacilityDao;

import java.sql.Connection;
import java.util.Collections;
import java.util.List;

import static com.kimdoolim.common.Mysql.*;

public class FacilityService {

    private static final FacilityService instance = new FacilityService();
    private FacilityService() {}
    public static FacilityService getInstance() { return instance; }

    private final FacilityDao facilityDao = FacilityDao.getInstance();
    private final LoginDao loginDao = LoginDao.getInstance();

    public List<Facility> getAllFacilities() {
        Connection conn = getConnection();
        List<Facility> list = facilityDao.findAll(conn);
        if (list == null) list = Collections.emptyList();
        close(conn);
        return list;
    }

    public List<User> getAvailableManagers() {
        Connection conn = getConnection();
        List<User> list = loginDao.findMiddleAdmins(conn);
        if (list == null) list = Collections.emptyList();
        close(conn);
        return list;
    }

    public boolean registerFacility(Facility facility) {
        Connection conn = getConnection();
        int result = facilityDao.save(conn, facility);
        
        boolean success = false;
        if (result > 0) {
            commit(conn);
            success = true;
        } else {
            rollback(conn);
        }
        close(conn);
        return success;
    }

    public boolean modifyFacility(Facility facility) {
        Connection conn = getConnection();
        int result = facilityDao.update(conn, facility);
        
        boolean success = false;
        if (result > 0) {
            commit(conn);
            success = true;
        } else {
            rollback(conn);
        }
        close(conn);
        return success;
    }

    public boolean removeFacility(long facilityId) {
        Connection conn = getConnection();
        int result = facilityDao.softDelete(conn, facilityId);
        
        boolean success = false;
        if (result > 0) {
            commit(conn);
            success = true;
        } else {
            rollback(conn);
        }
        close(conn);
        return success;
    }
}
