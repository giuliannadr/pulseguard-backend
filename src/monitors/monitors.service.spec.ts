import { Test, TestingModule } from '@nestjs/testing';
import { MonitorsService } from './monitors.service';
import { PrismaService } from '../prisma/prisma.service';
import { CheckerService } from '../checker/checker.service';
import { GithubService } from '../github/github.service';
import { NotFoundException } from '@nestjs/common';

const mockPrisma = {
  monitor: {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  check: {
    findMany: jest.fn(),
    create: jest.fn(),
  },
  securityIncident: {
    findMany: jest.fn(),
  },
};

const mockChecker = {
  checkUrl: jest.fn(),
};

const mockGithub = {
  scanRepoCommits: jest.fn(),
};

describe('MonitorsService', () => {
  let service: MonitorsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MonitorsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CheckerService, useValue: mockChecker },
        { provide: GithubService, useValue: mockGithub },
      ],
    }).compile();

    service = module.get<MonitorsService>(MonitorsService);
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('returns monitors for a given userId', async () => {
      const monitors = [{ id: '1', name: 'Test', userId: 'user-1' }];
      mockPrisma.monitor.findMany.mockResolvedValue(monitors);

      const result = await service.findAll('user-1');

      expect(result).toEqual(monitors);
      expect(mockPrisma.monitor.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-1' } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns a monitor when found', async () => {
      const monitor = { id: 'mon-1', name: 'API', userId: 'user-1' };
      mockPrisma.monitor.findFirst.mockResolvedValue(monitor);

      const result = await service.findOne('mon-1', 'user-1');
      expect(result).toEqual(monitor);
    });

    it('throws NotFoundException when monitor does not exist', async () => {
      mockPrisma.monitor.findFirst.mockResolvedValue(null);

      await expect(service.findOne('bad-id', 'user-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a monitor with correct defaults', async () => {
      const dto = { name: 'My API', url: 'https://api.example.com' } as any;
      const created = { id: 'new-id', ...dto, userId: 'user-1', intervalMinutes: 5, expectedStatus: 200 };
      mockPrisma.monitor.create.mockResolvedValue(created);

      const result = await service.create('user-1', dto);

      expect(result).toEqual(created);
      expect(mockPrisma.monitor.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-1',
            name: 'My API',
            expectedStatus: 200,
            intervalMinutes: 5,
          }),
        }),
      );
    });
  });

  describe('getMetrics', () => {
    it('returns null metrics when no checks exist', async () => {
      mockPrisma.monitor.findFirst.mockResolvedValue({ id: 'mon-1' });
      mockPrisma.check.findMany.mockResolvedValue([]);

      const result = await service.getMetrics('mon-1', 'user-1');
      expect(result).toEqual({ uptime: null, avgResponseMs: null, totalChecks: 0 });
    });

    it('calculates uptime correctly', async () => {
      mockPrisma.monitor.findFirst.mockResolvedValue({ id: 'mon-1' });
      mockPrisma.check.findMany.mockResolvedValue([
        { status: 'up', responseTimeMs: 100, checkedAt: new Date() },
        { status: 'up', responseTimeMs: 200, checkedAt: new Date() },
        { status: 'down', responseTimeMs: null, checkedAt: new Date() },
        { status: 'up', responseTimeMs: 150, checkedAt: new Date() },
      ]);

      const result = await service.getMetrics('mon-1', 'user-1');
      expect(result.uptime).toBe(75);
      expect(result.avgResponseMs).toBe(150);
      expect(result.totalChecks).toBe(4);
    });
  });

  describe('runCheckNow', () => {
    it('throws when monitor has no URL', async () => {
      mockPrisma.monitor.findFirst.mockResolvedValue({ id: 'mon-1', url: null });

      await expect(service.runCheckNow('mon-1', 'user-1')).rejects.toThrow(
        'This monitor has no URL configured for health checks.',
      );
    });

    it('runs a check and saves result', async () => {
      const monitor = { id: 'mon-1', url: 'https://example.com', expectedStatus: 200, expectedText: null };
      mockPrisma.monitor.findFirst.mockResolvedValue(monitor);
      mockChecker.checkUrl.mockResolvedValue({ status: 'up', responseTimeMs: 120, statusCode: 200 });
      mockPrisma.check.create.mockResolvedValue({ id: 'check-1', status: 'up' });

      const result = await service.runCheckNow('mon-1', 'user-1');
      expect(result).toEqual({ id: 'check-1', status: 'up' });
      expect(mockChecker.checkUrl).toHaveBeenCalledWith('https://example.com', 200, null);
    });
  });
});
