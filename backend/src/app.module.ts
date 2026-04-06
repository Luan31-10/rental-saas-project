import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { PropertyModule } from './property/property.module';
import { RoomModule } from './room/room.module';
import { TenantModule } from './tenant/tenant.module';
import { InvoiceModule } from './invoice/invoice.module';
import { AiModule } from './ai/ai.module';
import { MailModule } from './mail/mail.module';
import { ScheduleModule } from '@nestjs/schedule';
import { TasksService } from './tasks/tasks.service';
import { IssueModule } from './issue/issue.module';
import { PayosModule } from './payos/payos.module';
import { join } from 'path';

@Module({
  imports: [
    PrismaModule,
    UserModule,
    AuthModule,
    PropertyModule,
    RoomModule,
    TenantModule,
    InvoiceModule,
    AiModule,
    MailModule,
    ScheduleModule.forRoot(),
    IssueModule,
    PayosModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'), // Trỏ thẳng vào thư mục uploads
      serveRoot: '/uploads',
    }),
  ],
  controllers: [AppController],
  providers: [AppService, TasksService],
})
export class AppModule {}
