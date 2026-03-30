import { Module } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { PayosModule } from '../payos/payos.module'; // Thêm dòng này

@Module({
  imports: [PayosModule], // Và nhét vào đây
  providers: [TasksService],
})
export class TasksModule {}
