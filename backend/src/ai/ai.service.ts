import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import OpenAI from 'openai'; // 🔥 Import OpenAI
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';

interface AiActionData {
  propertyName?: string | null;
  address?: string | null;
  roomNumber?: string | null;
  price?: number | null;
  area?: number | null;
  tenantName?: string | null;
  phone?: string | null;
  citizenId?: string | null;
  deposit?: number | null;
  startDate?: string | null;
  electricity?: number | null;
  water?: number | null;
  isViolated?: boolean | null;
}

interface AiParsedResponse {
  intent: string;
  data: AiActionData;
  reply: string;
}

@Injectable()
export class AiService implements OnModuleInit {
  private openai: OpenAI;
  private readonly logger = new Logger(AiService.name);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    const apiKey = process.env.OPENAI_API_KEY || '';
    this.openai = new OpenAI({ apiKey });
  }

  onModuleInit() {
    this.logger.log(
      '🚀 Trợ lý AI LuanEZ (Powered by GPT) đã sẵn sàng phục vụ sếp!',
    );
  }

  async processChat(
    messages: { role: string; content: string }[],
    userId: string,
  ) {
    if (!process.env.OPENAI_API_KEY) {
      return {
        aiReply: '⚠️ Sếp ơi, chưa có OPENAI_API_KEY trong file .env kìa!',
      };
    }

    const filteredMessages = messages.filter(
      (m) => !m.content.includes('Chào sếp! Trợ lý LuanEZ AI đã sẵn sàng'),
    );

    const formattedMessages: { role: 'user' | 'assistant'; content: string }[] =
      filteredMessages.map((m) => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.content,
      }));

    const today = new Date().toLocaleDateString('vi-VN');

    const systemInstruction = `
      Bạn là trợ lý quản lý nhà trọ LuanEZ. Nhiệm vụ: Trích xuất thông tin thành JSON chuẩn.
      BẮT BUỘC TRẢ VỀ JSON THEO ĐỊNH DẠNG SAU:
      {
        "intent": "ADD_ROOM" | "ADD_PROPERTY" | "REGISTER_TENANT" | "CREATE_INVOICE" | "CHECK_OUT" | "GENERATE_CONTRACT" | "CHECK_EMPTY_ROOMS" | "REVENUE_REPORT" | "UNPAID_INVOICES" | "OTHER",
        "data": { "propertyName": "...", "roomNumber": "...", "price": 0, "area": 0, "tenantName": "...", "phone": "...", "citizenId": "...", "deposit": 0, "startDate": "...", "electricity": 0, "water": 0, "isViolated": false },
        "reply": "Câu trả lời thân thiện của bạn"
      }
      Hôm nay: ${today}.
    `;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemInstruction },
          ...formattedMessages,
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
      });

      const responseText = response.choices[0].message.content || '{}';
      const aiResponse = JSON.parse(responseText) as AiParsedResponse;

      let { intent } = aiResponse;
      const { data, reply } = aiResponse;

      if (intent === 'ADD_PROPERTY' && data?.roomNumber) intent = 'ADD_ROOM';

      const validIntents = [
        'ADD_ROOM',
        'ADD_PROPERTY',
        'REGISTER_TENANT',
        'CHECK_OUT',
        'CREATE_INVOICE',
        'GENERATE_CONTRACT',
        'CHECK_EMPTY_ROOMS',
        'REVENUE_REPORT',
        'UNPAID_INVOICES',
      ];

      if (!intent || !validIntents.includes(intent))
        return { aiReply: reply || 'Tôi nghe rõ ạ!' };

      switch (intent) {
        case 'ADD_PROPERTY':
          return await this.handleAddProperty(data, userId);
        case 'ADD_ROOM':
          return await this.handleAddRoom(data, userId);
        case 'REGISTER_TENANT':
          return await this.handleRegisterTenant(data, userId);
        case 'CREATE_INVOICE':
          return await this.handleCreateInvoice(data, userId);
        case 'CHECK_OUT':
          return await this.handleCheckOut(data, userId);
        case 'GENERATE_CONTRACT':
          return await this.handleGenerateContract(data, userId);
        case 'CHECK_EMPTY_ROOMS':
          return await this.handleCheckEmptyRooms(userId);
        case 'REVENUE_REPORT':
          return await this.handleRevenueReport(userId);
        case 'UNPAID_INVOICES':
          return await this.handleUnpaidInvoices(userId);
        default:
          return { aiReply: reply };
      }
    } catch (error: unknown) {
      this.logger.error('Lỗi OpenAI API:', error);
      return {
        aiReply:
          'Hệ thống OpenAI đang bận, sếp kiểm tra lại Key hoặc thử lại sau nhé.',
      };
    }
  }

  // --- CÁC HÀM XỬ LÝ LOGIC ---

  private async handleAddProperty(data: AiActionData, userId: string) {
    // 🛑 Ràng buộc: Chống trùng lặp tên khu trọ
    const existing = await this.prisma.property.findFirst({
      where: {
        name: { equals: String(data.propertyName || ''), mode: 'insensitive' },
        ownerId: userId,
      },
    });

    if (existing) {
      return {
        aiReply: `⚠️ Khu trọ **${data.propertyName}** đã có sẵn trong hệ thống rồi sếp ơi! Sếp đặt tên khác nhé.`,
      };
    }

    return {
      aiReply: `✅ Đã nháp khu trọ **${String(data.propertyName || '')}**.`,
      action: 'OPEN_MODAL_ADD_PROPERTY',
      payload: {
        name: String(data.propertyName || ''),
        address: String(data.address || ''),
      },
    };
  }

  private async handleAddRoom(data: AiActionData, userId: string) {
    // 🛑 Ràng buộc: Chống nhập số âm vô lý
    if (Number(data.price) < 0 || Number(data.area) < 0) {
      return {
        aiReply: '⚠️ Ô kìa sếp! Giá thuê và diện tích sao lại là số âm được ạ?',
      };
    }

    const property = await this.prisma.property.findFirst({
      where: {
        name: {
          contains: String(data.propertyName || ''),
          mode: 'insensitive',
        },
        ownerId: userId,
      },
    });

    if (!property)
      return {
        aiReply: `Không thấy khu trọ "${String(data.propertyName || '')}".`,
      };

    // 🛑 Ràng buộc: Chống tạo trùng số phòng trong cùng 1 khu trọ
    const existingRoom = await this.prisma.room.findFirst({
      where: {
        roomNumber: String(data.roomNumber || ''),
        propertyId: property.id,
      },
    });

    if (existingRoom) {
      return {
        aiReply: `⚠️ Phòng **${data.roomNumber}** đã tồn tại trong khu **${property.name}** rồi sếp ạ!`,
      };
    }

    return {
      aiReply: `✅ Đã nháp phòng ${String(data.roomNumber || '')}.`,
      action: 'OPEN_MODAL_ADD_ROOM',
      payload: {
        propertyId: property.id,
        propertyName: property.name,
        roomNumber: String(data.roomNumber || ''),
        price: Number(data.price || 0),
        area: Number(data.area || 20),
      },
    };
  }

  private async handleRegisterTenant(data: AiActionData, userId: string) {
    // 🛑 Ràng buộc: Chống tiền cọc âm
    if (Number(data.deposit) < 0) {
      return { aiReply: '⚠️ Tiền cọc không thể là số âm đâu sếp ơi!' };
    }

    const property = await this.prisma.property.findFirst({
      where: {
        name: {
          contains: String(data.propertyName || ''),
          mode: 'insensitive',
        },
        ownerId: userId,
      },
    });

    if (!property)
      return {
        aiReply: `Không thấy khu trọ "${String(data.propertyName || '')}".`,
      };

    const room = await this.prisma.room.findFirst({
      where: {
        roomNumber: String(data.roomNumber || ''),
        propertyId: property.id,
      },
      include: { tenants: { where: { status: 'ACTIVE' } } }, // Lấy kèm khách đang ở
    });

    if (!room) {
      return {
        aiReply: `Sếp ơi, em không tìm thấy phòng ${data.roomNumber} trong khu ${property.name}.`,
      };
    }

    // 🛑 Ràng buộc: Phòng đã có người ở thì cấm cho người mới vào
    if (room.tenants && room.tenants.length > 0) {
      return {
        aiReply: `⚠️ Phòng **${room.roomNumber}** hiện đang có khách ở rồi sếp ơi! Mình phải làm thủ tục trả phòng cho khách cũ trước nhé.`,
      };
    }

    return {
      aiReply: `✅ Đã lên hồ sơ khách **${String(data.tenantName || '')}**.`,
      action: 'OPEN_MODAL_ADD_TENANT',
      payload: {
        roomId: room.id,
        roomNumber: room.roomNumber,
        name: String(data.tenantName || ''),
        phone: String(data.phone || ''),
        email: String(data.citizenId || ''),
        deposit: Number(data.deposit || 0),
        startDate: String(
          data.startDate || new Date().toISOString().split('T')[0],
        ),
      },
    };
  }

  private async handleCreateInvoice(data: AiActionData, userId: string) {
    // 🛑 Ràng buộc: Số điện nước không được âm
    if (Number(data.electricity) < 0 || Number(data.water) < 0) {
      return {
        aiReply:
          '⚠️ Số điện hoặc số nước không hợp lệ (đang là số âm) sếp nhé!',
      };
    }

    const room = await this.prisma.room.findFirst({
      where: {
        roomNumber: String(data.roomNumber || ''),
        property: { ownerId: userId },
      },
      include: { property: true, tenants: { where: { status: 'ACTIVE' } } },
    });

    if (!room || !room.tenants[0])
      return {
        aiReply: `Phòng ${data.roomNumber} hiện tại đang trống, không chốt được hóa đơn sếp ạ.`,
      };

    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();

    // 🛑 Ràng buộc: Chống chốt hóa đơn 2 lần trong 1 tháng
    const existingInvoice = await this.prisma.invoice.findFirst({
      where: { roomId: room.id, month: currentMonth, year: currentYear },
    });

    if (existingInvoice) {
      return {
        aiReply: `⚠️ Hóa đơn tháng ${currentMonth}/${currentYear} của phòng **${room.roomNumber}** đã được chốt rồi. Sếp cẩn thận nhầm lẫn nhé!`,
      };
    }

    const total =
      room.price +
      Number(data.electricity || 0) *
        (room.property.baseElectricityPrice || 3500) +
      Number(data.water || 0) * (room.property.baseWaterPrice || 15000);

    return {
      aiReply: `✅ Đã tính hóa đơn phòng ${room.roomNumber}.`,
      action: 'OPEN_MODAL_CREATE_INVOICE',
      payload: {
        roomId: room.id,
        roomNumber: room.roomNumber,
        electricity: Number(data.electricity || 0),
        water: Number(data.water || 0),
        totalAmount: total,
        month: currentMonth,
        year: currentYear,
      },
    };
  }

  private async handleCheckOut(data: AiActionData, userId: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        roomNumber: String(data.roomNumber || ''),
        property: { ownerId: userId },
      },
      include: { tenants: { where: { status: 'ACTIVE' } } },
    });

    // 🛑 Ràng buộc: Đảm bảo phòng có người mới cho trả
    if (!room || !room.tenants || room.tenants.length === 0) {
      return {
        aiReply: `⚠️ Ô kìa, phòng ${data.roomNumber} làm gì có khách nào đang ở mà trả sếp ơi!`,
      };
    }

    return {
      aiReply: `✅ Chuẩn bị trả phòng cho khách ${room.tenants[0].name}.`,
      action: 'OPEN_MODAL_CHECK_OUT',
      payload: { roomId: room.id, roomNumber: room.roomNumber },
    };
  }

  private async handleGenerateContract(data: AiActionData, userId: string) {
    const room = await this.prisma.room.findFirst({
      where: {
        roomNumber: String(data.roomNumber || ''),
        property: { ownerId: userId },
      },
      include: { tenants: { where: { status: 'ACTIVE' } }, property: true },
    });

    if (!room || !room.tenants[0])
      return { aiReply: 'Phòng trống không soạn được hợp đồng sếp ạ.' };

    const tenant = room.tenants[0];
    const property = room.property;

    const today = new Date();
    const dd = today.getDate().toString().padStart(2, '0');
    const mm = (today.getMonth() + 1).toString().padStart(2, '0');
    const yyyy = today.getFullYear();

    const priceStr = room.price ? room.price.toLocaleString('vi-VN') : '0';
    const depositStr = tenant.deposit
      ? tenant.deposit.toLocaleString('vi-VN')
      : '0';
    const startDateStr = tenant.startDate
      ? new Date(tenant.startDate).toLocaleDateString('vi-VN')
      : '.../.../......';

    const prompt = `
    Hãy soạn một HỢP ĐỒNG THUÊ PHÒNG TRỌ thật chuyên nghiệp.
    ĐIỀU KIỆN BẮT BUỘC: 
    1. Tuyệt đối KHÔNG sử dụng ký tự Markdown như dấu sao, dấu thăng. Chỉ dùng chữ IN HOA để nhấn mạnh tiêu đề.
    2. Điền CHÍNH XÁC 100% các thông tin sau vào hợp đồng, không để trống:
    
    - Bên cho thuê (Bên A): Đại diện khu trọ ${property.name}
    - Địa chỉ khu trọ: ${property.address || '...........................................'}
    - Bên thuê (Bên B): Ông/Bà ${tenant.name}
    - Số điện thoại Bên B: ${tenant.phone || '....................'}
    - CCCD/Email Bên B: ${tenant.email || '....................'}
    - Phòng thuê: Số ${room.roomNumber}
    - Giá thuê: ${priceStr} VNĐ/tháng
    - Tiền cọc đã nhận: ${depositStr} VNĐ
    - Ngày bắt đầu ở: ${startDateStr}
    - Hôm nay lập ngày: ${dd} tháng ${mm} năm ${yyyy}
    
    Mẫu mở đầu BẮT BUỘC phải y hệt như sau (căn giữa bằng dấu cách):
                              CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM
                                    Độc lập - Tự do - Hạnh phúc
                                  ------------------------------

                                      HỢP ĐỒNG THUÊ PHÒNG TRỌ

    (Sau đó viết tiếp các điều khoản 1, 2, 3... thật rõ ràng, rành mạch. Phía cuối là phần ký tên của 2 bên đặt lệch sang 2 bên trái phải).
    `;

    const contractResponse = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content:
            'Bạn là chuyên gia pháp lý bất động sản. Tuân thủ tuyệt đối format văn bản thô (plain text) được giao.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });

    return {
      aiReply: `✅ Đã soạn xong hợp đồng cực chuẩn cho phòng ${room.roomNumber}! Tên khách, tiền cọc, giá phòng đều đã được điền tự động. Sếp xem nhé!`,
      action: 'DISPLAY_CONTRACT',
      payload: { content: contractResponse.choices[0]?.message?.content || '' },
    };
  }

  private async handleCheckEmptyRooms(userId: string) {
    const empty = await this.prisma.room.findMany({
      where: { status: 'AVAILABLE', property: { ownerId: userId } },
    });
    return {
      aiReply: `Còn ${empty.length} phòng trống: ${empty.map((r) => r.roomNumber).join(', ')}.`,
    };
  }

  private async handleRevenueReport(userId: string) {
    const paid = await this.prisma.invoice.findMany({
      where: { status: 'PAID', room: { property: { ownerId: userId } } },
    });
    const total = paid.reduce((s, i) => s + i.amount, 0);
    return { aiReply: `💰 Tổng thu: ${total.toLocaleString('vi-VN')} VNĐ.` };
  }

  private async handleUnpaidInvoices(userId: string) {
    const unpaid = await this.prisma.invoice.findMany({
      where: { status: 'PENDING', room: { property: { ownerId: userId } } },
      include: { room: true },
    });
    return {
      aiReply: unpaid.length
        ? `⚠️ Có ${unpaid.length} phòng chưa đóng tiền: ${unpaid.map((i) => i.room.roomNumber).join(', ')}`
        : '✅ Đã đóng đủ!',
    };
  }
}
