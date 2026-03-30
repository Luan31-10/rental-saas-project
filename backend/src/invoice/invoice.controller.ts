import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { InvoiceService, CreateInvoiceDto } from './invoice.service';
import { AuthGuard } from '../auth/auth.guard';

interface RequestWithUser {
  user: { email: string; role?: string };
}

@Controller('invoice')
@UseGuards(AuthGuard)
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  create(@Body() data: CreateInvoiceDto) {
    return this.invoiceService.create(data);
  }

  @Get('owner/all')
  findAllByOwner(@Request() req: RequestWithUser) {
    return this.invoiceService.findAllByOwner(req.user.email);
  }

  @Get()
  findAll(
    @Query('propertyId') propertyId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.invoiceService.findAll(propertyId, Number(month), Number(year));
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.invoiceService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.invoiceService.remove(id);
  }

  // 🔥 API GỬI EMAIL NHẮC NỢ NẰM Ở ĐÂY
  @Post(':id/send-email')
  sendEmail(@Param('id') id: string) {
    return this.invoiceService.sendReminder(id);
  }
  @UseGuards(AuthGuard)
  @Get('my-history')
  async getMyHistory(@Request() req: { user: { id: string } }) {
    return this.invoiceService.getHistoryByUserId(req.user.id);
  }
}
