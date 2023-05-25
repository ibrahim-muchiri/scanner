import { Module } from '@nestjs/common';
import { PoolProvider } from './db/pool.provider';
import { AxiosProvider } from './network/axios.provider';
import { HashService } from './hash/hash.service';
import { DateHelperService } from './temporal/date-helper/date-helper.service';

@Module({
  exports: [HashService, AxiosProvider, PoolProvider, DateHelperService],
  providers: [HashService, AxiosProvider, PoolProvider, DateHelperService],
})
export class CoreModule {}
