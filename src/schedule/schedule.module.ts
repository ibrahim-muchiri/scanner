import { Module } from '@nestjs/common';
import { SchedulerService } from './scheduler.service';

@Module({
  exports: [SchedulerService],
  providers: [SchedulerService],
})
export class ScheduleModule {}
