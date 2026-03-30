import { Module } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { TenantController } from './tenant.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { TenantGateway } from './tenant.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [TenantController],
  providers: [TenantService, TenantGateway],
})
export class TenantModule {}
