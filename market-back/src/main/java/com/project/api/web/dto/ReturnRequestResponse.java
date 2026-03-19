package com.project.api.web.dto;

import com.project.api.domain.ReturnRequest;
import com.project.api.domain.ReturnRequestStatus;
import com.project.api.domain.ReturnRequestType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ReturnRequestResponse {

    private Long id;
    private Long orderId;
    private ReturnRequestType type;
    private ReturnRequestStatus status;
    private String reason;
    private String sellerComment;
    private LocalDateTime createdAt;

    public static ReturnRequestResponse from(ReturnRequest r) {
        return new ReturnRequestResponse(
                r.getId(),
                r.getOrder().getId(),
                r.getType(),
                r.getStatus(),
                r.getReason(),
                r.getSellerComment(),
                r.getCreatedAt()
        );
    }
}
