import { Test, TestingModule } from '@nestjs/testing';
import { CheckerService } from './checker.service';

describe('CheckerService', () => {
  let service: CheckerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CheckerService],
    }).compile();

    service = module.get<CheckerService>(CheckerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkUrl', () => {
    it('returns down status when URL is unreachable', async () => {
      const result = await service.checkUrl('https://this-domain-definitely-does-not-exist-pulseguard.xyz', 200, null);
      expect(result.status).toBe('down');
      expect(result.errorMessage).toBeTruthy();
    }, 10000);
  });
});
