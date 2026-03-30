import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  // 🔥 1. Thêm checkoutUrl vào danh sách tham số
  async sendInvoiceEmail(
    tenantEmail: string,
    tenantName: string,
    roomNumber: string,
    month: number,
    electricity: number,
    water: number,
    totalAmount: number,
    checkoutUrl: string, // <-- Biến mới ở đây
  ) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #5b6af0, #a855f7); padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">HÓA ĐƠN TIỀN PHÒNG THÁNG ${month}</h2>
          <p style="margin: 5px 0 0;">LuanEZ SaaS - Quản lý trọ thông minh</p>
        </div>
        <div style="padding: 20px; color: #333;">
          <p>Xin chào <strong>${tenantName}</strong>,</p>
          <p>Hệ thống xin gửi đến bạn chi tiết hóa đơn tiền phòng <strong>P.${roomNumber}</strong> tháng này:</p>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0;">⚡ Số điện tiêu thụ:</td>
              <td style="text-align: right; font-weight: bold;">${electricity} kWh</td>
            </tr>
            <tr style="border-bottom: 1px solid #ddd;">
              <td style="padding: 10px 0;">💧 Số nước tiêu thụ:</td>
              <td style="text-align: right; font-weight: bold;">${water} m³</td>
            </tr>
            <tr>
              <td style="padding: 15px 0; font-size: 18px;"><strong>TỔNG THANH TOÁN:</strong></td>
              <td style="text-align: right; font-size: 18px; color: #e5484d; font-weight: bold;">${totalAmount.toLocaleString('vi-VN')} VNĐ</td>
            </tr>
          </table>
          <p style="text-align: center; margin-top: 30px;">
            <a href="${checkoutUrl}" style="background: #3ecf8e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Thanh toán ngay bằng mã VietQR
            </a>
          </p>
        </div>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to: tenantEmail,
        subject: `[LuanEZ] Hóa đơn tiền phòng tháng ${month} - Phòng ${roomNumber}`,
        html: emailHtml,
      });
      console.log(
        `✅ Đã gửi email hóa đơn (kèm link PayOS) thành công cho ${tenantEmail}`,
      );
    } catch (error) {
      console.error(`🔴 Lỗi khi gửi email:`, error);
    }
  }

  // 🔥 3. Thêm checkoutUrl vào danh sách tham số hàm Nhắc nợ
  async sendReminderEmail(
    tenantEmail: string,
    tenantName: string,
    roomNumber: string,
    amount: number,
    month: number,
    checkoutUrl: string,
  ) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: linear-gradient(135deg, #e5484d, #f76b15); padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">THÔNG BÁO NHẮC ĐÓNG TIỀN PHÒNG</h2>
          <p style="margin: 5px 0 0;">Tháng ${month} - Phòng ${roomNumber}</p>
        </div>
        <div style="padding: 20px; color: #333;">
          <p>Xin chào <strong>${tenantName}</strong>,</p>
          <p>Hệ thống LuanEZ xin thông báo: Hiện tại phòng <strong>${roomNumber}</strong> vẫn chưa thanh toán hóa đơn tiền phòng tháng ${month}.</p>
          <p style="font-size: 18px;">💰 Số tiền cần thanh toán: <strong style="color: #e5484d;">${amount.toLocaleString('vi-VN')} VNĐ</strong></p>
          <p>Bạn vui lòng sắp xếp thanh toán sớm để không bị gián đoạn dịch vụ nhé!</p>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="${checkoutUrl}" style="background: #e5484d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Thanh toán ngay
            </a>
          </p>

          <p style="margin-top: 20px; color: #666; font-size: 13px;"><em>Nếu bạn đã thanh toán, xin vui lòng bỏ qua email này. Cảm ơn bạn!</em></p>
        </div>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to: tenantEmail,
        subject: `[Nhắc nhở] Thanh toán tiền phòng ${roomNumber} tháng ${month}`,
        html: emailHtml,
      });
      console.log(
        `⚠️ Đã gửi email nhắc nợ tự động (kèm link PayOS) cho phòng ${roomNumber} (${tenantEmail})`,
      );
    } catch (error) {
      console.error(`🔴 Lỗi gửi email nhắc nợ:`, error);
    }
  }

  async sendResetPasswordEmail(email: string, name: string, resetLink: string) {
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #1e2330; padding: 20px; text-align: center; color: white;">
          <h2 style="margin: 0;">YÊU CẦU ĐẶT LẠI MẬT KHẨU</h2>
        </div>
        <div style="padding: 20px; color: #333;">
          <p>Xin chào <strong>${name}</strong>,</p>
          <p>Hệ thống LuanEZ nhận được yêu cầu đặt lại mật khẩu từ tài khoản của bạn.</p>
          <p>Vui lòng click vào nút bên dưới để tiến hành đổi mật khẩu mới (Link này chỉ có hiệu lực trong 15 phút):</p>
          <p style="text-align: center; margin-top: 30px;">
            <a href="${resetLink}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">
              Đặt lại mật khẩu
            </a>
          </p>
          <p style="margin-top: 20px; font-size: 13px; color: #666;">Nếu bạn không yêu cầu đổi mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      </div>
    `;

    try {
      await this.mailerService.sendMail({
        to: email,
        subject: '[LuanEZ] Đặt lại mật khẩu của bạn',
        html: emailHtml,
      });
      console.log(`✅ Đã gửi email reset mật khẩu cho ${email}`);
    } catch (error) {
      console.error(`🔴 Lỗi gửi email reset password:`, error);
    }
  }
}
