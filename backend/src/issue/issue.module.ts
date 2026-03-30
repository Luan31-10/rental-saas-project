import { Module } from '@nestjs/common';
import { IssueService } from './issue.service';
import { IssueController } from './issue.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { IssueGateway } from './issue.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [IssueController],
  providers: [IssueService, IssueGateway],
})
export class IssueModule {}
