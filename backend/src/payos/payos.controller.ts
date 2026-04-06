/* eslint-disable @typescript-eslint/no-unused-vars */
import { Controller, Post, Body, HttpCode, Req } from '@nestjs/common';
import { PayosService } from './payos.service';

@Controller('payos')
export class PayosController {
  constructor(private readonly payosService: PayosService) {}

  @Post('create-link')
  async createLink(@Body('invoiceId') invoiceId: string) {
    return this.payosService.createPaymentLink(invoiceId);
  }

  @Post('webhook')
  @HttpCode(200) // PayOS yêu cầu phải trả về status 200 nhanh nhất có thể
  async receiveWebhook(@Body() body: any) {
    return this.payosService.handleWebhook(body);
  }
  @Post('upgrade-plan')
  /* eslint-disable @typescript-eslint/no-unsafe-member-access */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment */
  /* eslint-disable @typescript-eslint/no-unsafe-argument */
  /* eslint-disable @typescript-eslint/no-explicit-any */
  async upgradePlan(@Body() body: { planId: string; email: string }) {
    // Truyền email từ Frontend lên cho chắc ăn 100%
    return this.payosService.createUpgradeLink(body.email, body.planId);
  }
  @Post('downgrade')
  async downgradePlan(@Body('email') email: string) {
    return this.payosService.downgradeToFree(email);
  }
}
