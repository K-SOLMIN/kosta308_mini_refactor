-- ══════════════════════════════════════════════════════════
-- 제한 일정 (BLOCK_PERIOD) DDL
-- ══════════════════════════════════════════════════════════
-- 참조 제약 조건(FK) 없이 설계 (앱 레이어에서 처리)
-- block_period        : 소프트 삭제 (감사 로그 확장 고려)
-- block_period_detail : 하드 삭제 (단순 연결 레코드)
--
-- target_type : 'FACILITY' | 'EQUIPMENT'
-- target_id   : 해당 유형의 PK (facility_id 또는 equipment_id)
--
-- 시간 미입력 시 처리 기준:
--   start_datetime → 해당일 00:00:00
--   end_datetime   → 해당일 23:59:59
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS block_period (
    block_period_id BIGINT       NOT NULL AUTO_INCREMENT  COMMENT '제한 일정 PK',
    title           VARCHAR(100) NOT NULL                 COMMENT '제한 일정 제목 (사유 겸용)',
    start_datetime  DATETIME     NOT NULL                 COMMENT '제한 시작 일시',
    end_datetime    DATETIME     NOT NULL                 COMMENT '제한 종료 일시',
    check_delete    TINYINT(1)   NOT NULL DEFAULT 0       COMMENT '삭제 여부 (0: 정상, 1: 삭제)',
    delete_date     DATETIME                              COMMENT '삭제 일시',
    created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '등록 일시',
    PRIMARY KEY (block_period_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='제한 일정';


CREATE TABLE IF NOT EXISTS block_period_detail (
    block_period_detail_id BIGINT      NOT NULL AUTO_INCREMENT COMMENT '제한 대상 PK',
    block_period_id        BIGINT      NOT NULL                COMMENT '제한 일정 ID (FK 없음)',
    target_type            VARCHAR(20) NOT NULL                COMMENT '대상 유형: FACILITY | EQUIPMENT',
    target_id              BIGINT      NOT NULL                COMMENT '대상 ID (facility_id 또는 equipment_id)',
    PRIMARY KEY (block_period_detail_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='제한 일정 대상 (시설 또는 비품)';
