package com.kimdoolim.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Collections;
import java.util.List;

@NoArgsConstructor
@AllArgsConstructor
@Data
@lombok.Builder
public class Equipment {

    private long    equipmentId;
    private Long    facilityId;   // nullable
    private Integer managerId;    // nullable
    private String  managerName;  // LEFT JOIN user
    private String  facilityName; // LEFT JOIN facility
    private String  name;
    private String  location;
    private String  serialNo;
    private String  status;       // 정상 | 수리 | 점검
    private boolean checkDelete;

    // DB GROUP BY 집계값 (EQUIPMENTDETAIL COUNT/SUM)
    private int detailCount;  // 총 낱개 수 (0이면 단품으로 간주)
    private int normalCount;  // 정상 낱개 수
    private int issueCount;   // 이슈(수리·점검·분실) 낱개 수

    // eager load: 낱개 목록
    private List<EquipmentDetail> details;

    /** EQUIPMENTDETAIL row가 1개라도 있으면 세트, 없으면 단품 */
    public boolean isSet() { return detailCount > 0; }

    /** null-safe getter (Lombok 자동 생성 대신) */
    public List<EquipmentDetail> getDetails() {
        return details != null ? details : Collections.emptyList();
    }
}
