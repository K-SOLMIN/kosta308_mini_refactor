package com.kimdoolim.common;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

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

    private static HikariDataSource ds;

    static {
        try {
            // 2. 설정 객체 생성
            HikariConfig config = new HikariConfig();

            // 접속 정보 (상수로 선언되어 있다고 가정하거나 직접 입력)
            config.setJdbcUrl(URL);
            config.setUsername(USER);
            config.setPassword(PASSWORD);
            config.setDriverClassName("com.mysql.cj.jdbc.Driver"); // 드라이버 명시

            // 3. 풀(Pool) 설정 (도쿄 리전 최적화)
            config.setMaximumPoolSize(10);          // 최대 연결 개수 10개
            config.setMinimumIdle(5);               // 항상 유지할 최소 연결 개수
            config.setConnectionTimeout(30000);     // 연결 대기 시간 최대 30초
            config.setIdleTimeout(600000);          // 유휴 연결 폐기 시간 (10분)

            // 4. DataSource 초기화 (서버 실행 시 딱 한 번만 실행됨)
            ds = new HikariDataSource(config);

        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("DB 연결 풀 초기화 실패!");
        }
    }

    // 5. 외부에서 연결이 필요할 때 호출하는 메서드
    public static Connection getConnection() throws SQLException {
        return ds.getConnection(); // 대기실(Pool)에서 놀고 있는 연결을 하나 꺼내서 리턴
    }

    // (선택) 서버 종료 시 풀을 닫아주는 메서드
    public static void closePool() {
        if (ds != null) {
            ds.close();
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
