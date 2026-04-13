package com.kimdoolim.common;

import java.io.IOException;
import java.io.InputStream;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.util.Properties;

public class Mysql {

    private static final String URL;
    private static final String USER;
    private static final String PASSWORD;

    static {
        Properties props = new Properties();
        try (InputStream is = Mysql.class.getClassLoader().getResourceAsStream("db.properties")) {
            if (is == null) throw new RuntimeException("db.properties 파일을 찾을 수 없습니다.");
            props.load(is);
        } catch (IOException e) {
            throw new RuntimeException("db.properties 로드 실패", e);
        }
        URL      = props.getProperty("db.url");
        USER     = props.getProperty("db.user");
        PASSWORD = props.getProperty("db.password");
    }

    private Mysql() {}

    public static Connection getConnection() {
        try {
            Class.forName("com.mysql.cj.jdbc.Driver");
            Connection con = DriverManager.getConnection(URL, USER, PASSWORD);
            con.setAutoCommit(false);
            return con;
        } catch (ClassNotFoundException e) {
            throw new RuntimeException("MySQL 드라이버 로드 실패", e);
        } catch (SQLException e) {
            throw new RuntimeException("DB 연결 실패", e);
        }
    }

    public static void commit(Connection con) {
        if (con == null) return;
        try {
            con.commit();
        } catch (SQLException e) {
            throw new RuntimeException("commit 실패", e);
        }
    }

    public static void rollback(Connection con) {
        if (con == null) return;
        try {
            con.rollback();
        } catch (SQLException e) {
            throw new RuntimeException("rollback 실패", e);
        }
    }

    public static void close(AutoCloseable... resources) {
        for (AutoCloseable res : resources) {
            if (res != null) {
                try {
                    res.close();
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }
}
