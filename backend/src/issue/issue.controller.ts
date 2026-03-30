import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { IssueService, CreateIssueDto } from './issue.service';
import { AuthGuard } from '../auth/auth.guard';

interface RequestWithUser {
  user: { email: string; role?: string };
}

@Controller('issue')
@UseGuards(AuthGuard)
export class IssueController {
  constructor(private readonly issueService: IssueService) {}

  @Post()
  create(@Body() data: CreateIssueDto, @Request() req: RequestWithUser) {
    return this.issueService.create(data, req.user.email);
  }

  @Get('my-issues')
  getMyIssues(@Request() req: RequestWithUser) {
    return this.issueService.getMyIssues(req.user.email);
  }

  @Get('property/:propertyId')
  getIssuesByProperty(@Param('propertyId') propertyId: string) {
    return this.issueService.getIssuesByProperty(propertyId);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body('status') status: string) {
    return this.issueService.updateStatus(id, status);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.issueService.remove(id);
  }

  // 🔥 2 API MỚI CHO GIAO DIỆN CHAT
  @Post(':id/comment')
  addComment(
    @Param('id') id: string,
    @Body() data: { content: string; sender: string },
  ) {
    return this.issueService.addComment(id, data.content, data.sender);
  }

  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.issueService.getComments(id);
  }
}
