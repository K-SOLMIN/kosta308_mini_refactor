package com.kimdoolim.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockPeriodDetail {

    private long   blockPeriodDetailId;
    private long   blockPeriodId;
    private String targetType;   // "FACILITY" | "EQUIPMENT"
    private long   targetId;
    private String targetName;   // JOIN으로 조회, DB 컬럼 아님
}
