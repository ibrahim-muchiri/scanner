import { Injectable } from '@nestjs/common';
import crypto, { BinaryLike } from 'crypto';

@Injectable()
export class HashService {
  stringifyAndGenerateHash(data: any): string {
    return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
  }

  generateHash(data: BinaryLike): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }
}
