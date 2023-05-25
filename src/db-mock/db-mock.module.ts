import { Module } from '@nestjs/common';
import { DbMockService } from './db-mock.service';
import { DbMockController } from './db-mock.controller';
import { SportModule } from 'src/sport/sport.module';
import { FileWriter } from './file-writer';

@Module({
  imports: [SportModule],
  providers: [DbMockService, FileWriter],
  exports: [FileWriter],
  controllers: [DbMockController],
})
export class DbMockModule {}
