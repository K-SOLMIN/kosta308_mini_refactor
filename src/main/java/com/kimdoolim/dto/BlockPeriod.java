package com.kimdoolim.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlockPeriod {

    private long   blockPeriodId;
    private String title;
    private String startDatetime;  // "yyyy-MM-dd HH:mm:ss"
    private String endDatetime;
    private boolean checkDelete;
    private String deleteDate;
    private String createdAt;

    // eager-load 된 대상 목록 (DB 컬럼 아님)
    private List<BlockPeriodDetail> details;

    /** null-safe getter */
    public List<BlockPeriodDetail> getDetails() {
        return details != null ? details : Collections.emptyList();
    }
}
