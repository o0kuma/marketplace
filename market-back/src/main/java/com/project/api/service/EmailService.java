package com.project.api.service;

import com.project.api.domain.Order;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

/**
 * Sends transactional emails: password reset, order confirmation, shipping notice.
 * When Spring Mail is not configured, logs and skips sending.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:noreply@market.example.com}")
    private String fromEmail;

    @Value("${app.front-url:http://localhost:3000}")
    private String frontUrl;

    @Value("${spring.mail.host:}")
    private String mailHost;

    public boolean isConfigured() {
        return mailHost != null && !mailHost.isBlank();
    }

    public void sendPasswordResetEmail(String toEmail, String memberName, String resetToken) {
        if (!isConfigured()) {
            log.warn(
                    "Password reset was requested but mail is not configured (set MAIL_HOST / spring.mail.host). No email sent.");
        }
        String resetLink = frontUrl + "/reset-password?token=" + resetToken;
        String subject = "비밀번호 재설정 링크";
        String body = String.format("""
            <p>안녕하세요, %s님.</p>
            <p>비밀번호 재설정을 요청하셨습니다. 아래 링크를 클릭하여 새 비밀번호를 설정해 주세요.</p>
            <p><a href="%s">비밀번호 재설정하기</a></p>
            <p>링크는 1시간 동안 유효합니다. 요청하지 않으셨다면 이 메일을 무시해 주세요.</p>
            """, memberName != null ? memberName : "회원", resetLink);
        sendHtml(toEmail, subject, body);
    }

    public void sendOrderConfirmationEmail(String toEmail, String recipientName, Order order) {
        String subject = "주문이 접수되었습니다 (주문 #" + order.getId() + ")";
        String orderLink = frontUrl + "/orders/" + order.getId();
        String body = String.format("""
            <p>안녕하세요, %s님.</p>
            <p>주문이 접수되었습니다.</p>
            <p><strong>주문 번호:</strong> #%d</p>
            <p><strong>총 결제 금액:</strong> %d원</p>
            <p><a href="%s">주문 상세 보기</a></p>
            """, recipientName != null ? recipientName : "회원", order.getId(), order.getTotalAmount(), orderLink);
        sendHtml(toEmail, subject, body);
    }

    public void sendPaymentCompleteEmail(String toEmail, String recipientName, Order order) {
        String subject = "결제가 완료되었습니다 (주문 #" + order.getId() + ")";
        String orderLink = frontUrl + "/orders/" + order.getId();
        String body = String.format("""
            <p>안녕하세요, %s님.</p>
            <p>주문 #%d 결제가 완료되었습니다.</p>
            <p><strong>총 결제 금액:</strong> %d원</p>
            <p><a href="%s">주문 상세 보기</a></p>
            """, recipientName != null ? recipientName : "회원", order.getId(), order.getTotalAmount(), orderLink);
        sendHtml(toEmail, subject, body);
    }

    public void sendShippingNoticeEmail(String toEmail, String recipientName, Order order) {
        String subject = "주문 #" + order.getId() + " 배송이 시작되었습니다";
        String orderLink = frontUrl + "/orders/" + order.getId();
        String trackingInfo = order.getTrackingNumber() != null && !order.getTrackingNumber().isBlank()
                ? "<p><strong>운송장 번호:</strong> " + order.getTrackingNumber() + "</p>"
                : "";
        String body = String.format("""
            <p>안녕하세요, %s님.</p>
            <p>주문 #%d 상품이 배송 중입니다.</p>
            %s
            <p><a href="%s">주문 상세 보기</a></p>
            """, recipientName != null ? recipientName : "회원", order.getId(), trackingInfo, orderLink);
        sendHtml(toEmail, subject, body);
    }

    private void sendHtml(String to, String subject, String htmlBody) {
        if (!isConfigured()) {
            log.debug("Mail not configured; skip sending to {}: {}", to, subject);
            return;
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlBody, true);
            mailSender.send(message);
            log.info("Email sent to {}: {}", to, subject);
        } catch (MailException | MessagingException e) {
            log.warn("Failed to send email to {}: {} - {}", to, subject, e.getMessage());
        }
    }
}
