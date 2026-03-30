import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import * as dotenv from 'dotenv';
dotenv.config();

interface AiParsedResponse {
  intent: string;
  data: Record<string, string | number | null>;
  reply: string;
}

@Injectable()
export class AiService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });
  }

  async processChat(messages: { role: string; content: string }[]) {
    if (!this.model) {
      return { aiReply: 'Hệ thống AI chưa sẵn sàng.' };
    }

    // Lọc bỏ câu chào mặc định
    const filteredMessages = messages.filter(
      (m) => !m.content.includes('Chào sếp! Trợ lý LuanEZ AI đã sẵn sàng'),
    );

    const chatContext = filteredMessages
      .map((m) => `${m.role === 'user' ? 'Sếp' : 'AI'}: ${m.content}`)
      .join('\n');

    // Prompt kỷ luật thép + Ví dụ mẫu (Few-shot)
    const systemInstruction = `
      NHIỆM VỤ TỐI CAO: Bạn là MÁY TRÍCH XUẤT DỮ LIỆU. Chỉ trả về JSON chuẩn, KHÔNG BÌNH LUẬN HAY CHÀO HỎI.
      
      Hãy đọc LỊCH SỬ CHAT bên dưới. Xác định Ý ĐỊNH CHÍNH (intent) và trích xuất thông tin (data). Cái nào không có thì để null.

      CÁC Ý ĐỊNH (INTENT) CHO PHÉP: "ADD_ROOM", "ADD_PROPERTY", "REGISTER_TENANT", "CREATE_INVOICE", "CHECK_OUT", "CHECK_EMPTY_ROOMS", "REVENUE_REPORT", "UNPAID_INVOICES", "GENERATE_CONTRACT"

      --- HƯỚNG DẪN BẰNG VÍ DỤ CỤ THỂ ---
      Ví dụ 1:
      Chat: "Thêm phòng 105 đi"
      JSON: {"intent": "ADD_ROOM", "data": {"propertyName": null, "address": null, "roomNumber": "105", "price": null, "area": null, "tenantName": null, "phone": null, "citizenId": null, "deposit": null, "startDate": null, "electricity": null, "water": null}, "reply": "Đã nhận lệnh"}

      Ví dụ 2:
      Chat: "Thêm phòng 102 khu A giá 3 củ rộng 20m"
      JSON: {"intent": "ADD_ROOM", "data": {"propertyName": "khu A", "address": null, "roomNumber": "102", "price": 3000000, "area": 20, "tenantName": null, "phone": null, "citizenId": null, "deposit": null, "startDate": null, "electricity": null, "water": null}, "reply": "Đã nhận lệnh"}

      Ví dụ 3: 
      Chat: "Khách Yến Vy thuê phòng 201 khu Bình Thạnh"
      JSON: {"intent": "REGISTER_TENANT", "data": {"propertyName": "Bình Thạnh", "address": null, "roomNumber": "201", "price": null, "area": null, "tenantName": "Yến Vy", "phone": null, "citizenId": null, "deposit": null, "startDate": null, "electricity": null, "water": null}, "reply": "Đã nhận lệnh"}
      
      --- KẾT QUẢ BẮT BUỘC PHẢI THEO CẤU TRÚC JSON SAU ---
      {
        "intent": "...",
        "data": { 
          "propertyName": "...", 
          "address": "...", 
          "roomNumber": "...", 
          "price": 0, 
          "area": 0,
          "tenantName": "...", 
          "phone": "...", 
          "citizenId": "...",
          "deposit": 0,
          "startDate": "...",
          "electricity": 0, 
          "water": 0
        },
        "reply": "Xác nhận."
      }
    `;

    const finalPrompt =
      systemInstruction +
      '\n\n--- LỊCH SỬ CHAT (ĐỂ GOM DỮ LIỆU) ---\n' +
      chatContext +
      '\n\nMÁY TRÍCH XUẤT JSON TRẢ VỀ:';

    try {
      const result = await this.model.generateContent(finalPrompt);
      const responseText = result.response.text();
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        throw new Error('JSON Error');
      }

      const aiResponse = JSON.parse(jsonMatch[0]) as AiParsedResponse;
      let { intent } = aiResponse;
      const { data } = aiResponse;

      if (intent === 'ADD_PROPERTY' && data.roomNumber) {
        intent = 'ADD_ROOM';
      }

      if (
        !intent ||
        ![
          'ADD_ROOM',
          'ADD_PROPERTY',
          'REGISTER_TENANT',
          'CHECK_OUT',
          'CREATE_INVOICE',
          'CHECK_EMPTY_ROOMS',
          'REVENUE_REPORT',
          'UNPAID_INVOICES',
          'GENERATE_CONTRACT',
        ].includes(intent)
      ) {
        return {
          aiReply: `⚠️ Trợ lý chưa bắt được lệnh của sếp. Sếp muốn Thêm phòng, Khách thuê, hay Tạo hóa đơn ạ? (Data nhận được: ${JSON.stringify(data)})`,
        };
      }

      if (intent === 'ADD_PROPERTY') {
        if (!data.propertyName || !data.address) {
          return {
            aiReply: `⚠️ Sếp ơi, thiếu thông tin rồi! Tạo khu trọ mới cần đủ **Tên khu trọ** và **Địa chỉ** ạ.`,
          };
        }
        return {
          aiReply: `✅ Đã lên nháp thông tin khu trọ **${data.propertyName}**. Sếp kiểm tra lại form nhé!`,
          action: 'OPEN_MODAL_ADD_PROPERTY',
          payload: {
            name: String(data.propertyName),
            address: String(data.address),
          },
        };
      }

      if (intent === 'ADD_ROOM') {
        if (
          !data.propertyName ||
          !data.roomNumber ||
          data.price === null ||
          data.price === undefined ||
          data.area === null ||
          data.area === undefined
        ) {
          return {
            aiReply: `⚠️ Để thêm phòng, sếp đọc đủ giúp tôi: **Tên khu trọ, Số phòng, Giá tiền, và Diện tích** để lên nháp form nhé.`,
          };
        }

        const property = await this.prisma.property.findFirst({
          where: {
            name: { contains: String(data.propertyName), mode: 'insensitive' },
          },
        });

        if (!property) {
          return {
            aiReply: `Sếp ơi, không thấy khu trọ nào tên "${data.propertyName}" trong hệ thống.`,
          };
        }

        return {
          aiReply: `✅ Đã gom đủ dữ liệu phòng ${data.roomNumber} cho khu ${property.name}. Sếp duyệt qua rồi bấm lưu nhé!`,
          action: 'OPEN_MODAL_ADD_ROOM',
          payload: {
            propertyId: property.id,
            propertyName: property.name,
            roomNumber: String(data.roomNumber),
            price: Number(data.price),
            area: Number(data.area),
          },
        };
      }

      if (intent === 'REGISTER_TENANT') {
        if (
          !data.propertyName ||
          !data.roomNumber ||
          !data.tenantName ||
          !data.phone ||
          !data.citizenId ||
          data.deposit === null ||
          data.deposit === undefined ||
          !data.startDate
        ) {
          return {
            aiReply: `⚠️ Hồ sơ khách thiếu thông tin! Sếp bổ sung giúp: **Tên khu trọ, Số phòng, Tên khách, SĐT, Số CCCD, Tiền cọc, và Ngày vào ở**.`,
          };
        }

        const property = await this.prisma.property.findFirst({
          where: {
            name: { contains: String(data.propertyName), mode: 'insensitive' },
          },
        });

        if (!property)
          return {
            aiReply: `Sếp ơi, không tìm thấy khu trọ "${data.propertyName}".`,
          };

        const room = await this.prisma.room.findFirst({
          where: {
            roomNumber: String(data.roomNumber),
            propertyId: property.id,
          },
        });

        if (!room || room.status !== 'AVAILABLE') {
          return {
            aiReply: `Phòng ${data.roomNumber} tại khu ${property.name} không tồn tại hoặc đã có người ở.`,
          };
        }

        return {
          aiReply: `✅ Đã gom đủ hồ sơ khách ${data.tenantName} vào phòng ${room.roomNumber} (${property.name}). Sếp rà soát form nhé!`,
          action: 'OPEN_MODAL_ADD_TENANT',
          payload: {
            roomId: room.id,
            roomNumber: room.roomNumber,
            name: String(data.tenantName),
            phone: String(data.phone),
            email: `CCCD: ${data.citizenId}`,
            deposit: Number(data.deposit),
            startDate: String(data.startDate),
          },
        };
      }

      if (intent === 'CREATE_INVOICE') {
        if (
          !data.propertyName ||
          !data.roomNumber ||
          data.electricity === null ||
          data.electricity === undefined ||
          data.water === null ||
          data.water === undefined
        ) {
          return {
            aiReply: `⚠️ Chốt hóa đơn cần chính xác. Sếp bổ sung giúp: **Tên khu trọ, Số phòng, Số điện, và Số nước** nhé!`,
          };
        }

        const property = await this.prisma.property.findFirst({
          where: {
            name: { contains: String(data.propertyName), mode: 'insensitive' },
          },
        });

        if (!property)
          return {
            aiReply: `Sếp ơi, không tìm thấy khu trọ "${data.propertyName}".`,
          };

        const room = await this.prisma.room.findFirst({
          where: {
            roomNumber: String(data.roomNumber),
            propertyId: property.id,
          },
          include: { tenants: { where: { status: 'ACTIVE' } } },
        });

        if (!room || !room.tenants[0])
          return {
            aiReply: `Phòng ${data.roomNumber} (${property.name}) hiện không có khách để làm hóa đơn.`,
          };

        const elec = Number(data.electricity);
        const waterNum = Number(data.water);
        const total = room.price + elec * 3500 + waterNum * 15000;

        return {
          aiReply: `✅ Đã tính toán xong hóa đơn phòng ${room.roomNumber} - ${property.name}. Sếp duyệt form nhé!`,
          action: 'OPEN_MODAL_CREATE_INVOICE',
          payload: {
            roomId: room.id,
            roomNumber: room.roomNumber,
            roomPrice: room.price,
            electricity: elec,
            water: waterNum,
            totalAmount: total,
            month: new Date().getMonth() + 1,
            year: new Date().getFullYear(),
          },
        };
      }

      if (intent === 'CHECK_OUT') {
        if (!data.propertyName || !data.roomNumber)
          return {
            aiReply: `Sếp muốn làm thủ tục trả phòng cho **Số phòng** nào ở **Khu trọ** nào ạ?`,
          };

        const property = await this.prisma.property.findFirst({
          where: {
            name: { contains: String(data.propertyName), mode: 'insensitive' },
          },
        });

        if (!property)
          return {
            aiReply: `Sếp ơi, không tìm thấy khu trọ "${data.propertyName}".`,
          };

        const room = await this.prisma.room.findFirst({
          where: {
            roomNumber: String(data.roomNumber),
            propertyId: property.id,
          },
        });

        if (!room)
          return {
            aiReply: `Không thấy phòng ${data.roomNumber} tại khu ${property.name} sếp ơi.`,
          };

        return {
          aiReply: `⚠️ Sếp đang yêu cầu trả phòng ${data.roomNumber} (${property.name}). Sếp vui lòng duyệt thao tác này trên màn hình!`,
          action: 'OPEN_MODAL_CHECK_OUT',
          payload: { roomId: room.id, roomNumber: room.roomNumber },
        };
      }

      if (intent === 'GENERATE_CONTRACT') {
        if (!data.propertyName || !data.roomNumber)
          return {
            aiReply:
              'Sếp muốn soạn hợp đồng cho **Số phòng** ở **Khu trọ** nào ạ?',
          };

        const property = await this.prisma.property.findFirst({
          where: {
            name: { contains: String(data.propertyName), mode: 'insensitive' },
          },
        });

        if (!property)
          return {
            aiReply: `Sếp ơi, không tìm thấy khu trọ "${data.propertyName}".`,
          };

        const room = await this.prisma.room.findFirst({
          where: {
            roomNumber: String(data.roomNumber),
            propertyId: property.id,
          },
          include: { tenants: { where: { status: 'ACTIVE' } }, property: true },
        });

        if (!room || !room.tenants[0])
          return {
            aiReply: `Phòng ${data.roomNumber} tại khu ${property.name} đang trống, không thể soạn hợp đồng.`,
          };

        const tenant = room.tenants[0];

        const contractPrompt = `Soạn "HỢP ĐỒNG THUÊ NHÀ TRỌ" tiếng Việt.\n\nBẮT BUỘC BẮT ĐẦU BẰNG ĐÚNG 4 DÒNG SAU:\n                                CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\n                                      Độc lập - Tự do - Hạnh phúc\n                                    -------------------------------\n                                        HỢP ĐỒNG THUÊ NHÀ\n\nNội dung bắt buộc:\n- BÊN CHO THUÊ: Ông Võ Thành Luân\n- BÊN THUÊ: ${tenant.name}, SĐT: ${tenant.phone}, Email/CCCD: ${tenant.email || '...'}\n- ĐỊA ĐIỂM: Phòng ${room.roomNumber}, thuộc ${room.property.name}.\n- GIÁ THUÊ: ${room.price.toLocaleString('vi-VN')} VNĐ/tháng.\n- TIỀN CỌC: ${tenant.deposit ? tenant.deposit.toLocaleString('vi-VN') : '0'} VNĐ.\n- NGÀY BẮT ĐẦU: ${tenant.startDate.toLocaleDateString('vi-VN')}.\nViết rõ ràng các điều khoản.`;

        const contractResult = await this.model.generateContent(contractPrompt);
        return {
          aiReply: `✅ Đã soạn xong hợp đồng cho khách ${tenant.name} tại phòng ${room.roomNumber} (${property.name})!`,
          action: 'DISPLAY_CONTRACT',
          payload: { content: contractResult.response.text() },
        };
      }

      if (intent === 'CHECK_EMPTY_ROOMS') {
        const empty = await this.prisma.room.findMany({
          where: { status: 'AVAILABLE' },
        });
        return {
          aiReply: `Báo cáo sếp, hiện có ${empty.length} phòng trống: ${empty.map((r) => r.roomNumber).join(', ')}.`,
        };
      }

      if (intent === 'REVENUE_REPORT') {
        const paid = await this.prisma.invoice.findMany({
          where: { status: 'PAID' },
        });
        const total = paid.reduce((s, i) => s + i.amount, 0);
        return {
          aiReply: `💰 Tổng tiền phòng đã thu được là: ${total.toLocaleString()} VNĐ thưa sếp!`,
        };
      }

      if (intent === 'UNPAID_INVOICES') {
        const unpaid = await this.prisma.invoice.findMany({
          where: { status: 'PENDING' },
          include: { room: true },
        });
        if (unpaid.length === 0)
          return { aiReply: 'Hiện không có ai nợ tiền cả sếp ơi!' };
        return {
          aiReply: `⚠️ Đang có ${unpaid.length} phòng chưa đóng tiền: ${unpaid.map((i) => 'P.' + i.room?.roomNumber).join(', ')}.`,
        };
      }

      return { aiReply: aiResponse.reply };
    } catch (e) {
      console.error(e);
      return { aiReply: 'Hệ thống đang bảo trì, sếp vui lòng thử lại sau.' };
    }
  }
}
