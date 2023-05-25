import { Test, TestingModule } from '@nestjs/testing';
import { EventEmitter2 } from 'eventemitter2';
import { crawlConfig } from '../core/config';
import { DbMockController } from './db-mock.controller';
import { DbMockService } from './db-mock.service';

describe('DbMockController', () => {
  let controller: DbMockController;

  const mockDbMockService = {
    retrieveBundesliga: jest.fn().mockReturnThis(),
    manipulateJSON: jest.fn().mockReturnThis(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DbMockController],
      providers: [
        DbMockService,
        {
          provide: crawlConfig.KEY,
          useValue: {
            mockApi: true,
          },
        },
        EventEmitter2,
      ],
    })
      .overrideProvider(DbMockService)
      .useValue(mockDbMockService)
      .compile();

    controller = module.get<DbMockController>(DbMockController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should get Bundesliga', () => {
    controller.getBundesliga(18444).then(() => {
      expect(mockDbMockService.retrieveBundesliga).toHaveBeenCalled();
    });
  });
});
