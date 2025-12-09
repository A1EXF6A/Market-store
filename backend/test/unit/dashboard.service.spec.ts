import { DashboardService } from '../../src/dashboard/dashboard.service';
import { Repository } from 'typeorm';

function mockRepo() {
  return {
    count: jest.fn(async () => 0),
    createQueryBuilder: jest.fn(() => ({
      innerJoin: jest.fn(() => ({
        where: jest.fn(() => ({
          select: jest.fn(() => ({
            getRawOne: jest.fn(async () => ({ average: '0' })),
          })),
        })),
      })),
      where: jest.fn(() => ({
        andWhere: jest.fn(() => ({
          select: jest.fn(() => ({
            getRawOne: jest.fn(async () => ({ total: '0' })),
          })),
        })),
      })),
    })),
  } as unknown as Repository<any>;
}

describe('DashboardService (unit)', () => {
  let service: DashboardService;
  let userRepo: Repository<any>;
  let itemRepo: Repository<any>;
  let favoriteRepo: Repository<any>;
  let chatRepo: Repository<any>;
  let reportRepo: Repository<any>;
  let incidentRepo: Repository<any>;
  let ratingRepo: Repository<any>;

  beforeEach(() => {
    userRepo = mockRepo();
    itemRepo = mockRepo();
    favoriteRepo = mockRepo();
    chatRepo = mockRepo();
    reportRepo = mockRepo();
    incidentRepo = mockRepo();
    ratingRepo = mockRepo();
    service = new DashboardService(
      userRepo as any,
      itemRepo as any,
      favoriteRepo as any,
      chatRepo as any,
      reportRepo as any,
      incidentRepo as any,
      ratingRepo as any,
    );
  });

  it('getBuyerStats returns favorites and chats counts', async () => {
    (favoriteRepo.count as any).mockResolvedValue(3);
    (chatRepo.count as any).mockResolvedValue(2);
    const res = await service.getBuyerStats(10);
    expect(favoriteRepo.count).toHaveBeenCalledWith({ where: { userId: 10 } });
    expect(chatRepo.count).toHaveBeenCalled();
    expect(res).toEqual({ favoritesCount: 3, activeChatsCount: 2 });
  });

  it('getSellerStats aggregates products, chats, averageRating and totalSales', async () => {
    (itemRepo.count as any).mockResolvedValue(5);
    (chatRepo.count as any).mockResolvedValue(4);
    // Stub query builders with expected aggregates
    (ratingRepo.createQueryBuilder as any).mockImplementation(() => ({
      innerJoin: () => ({
        where: () => ({
          select: () => ({
            getRawOne: jest.fn(async () => ({ average: '4.5' })),
          }),
        }),
      }),
    }));
    (itemRepo.createQueryBuilder as any).mockImplementation(() => ({
      where: () => ({
        andWhere: () => ({
          select: () => ({
            getRawOne: jest.fn(async () => ({ total: '123.4' })),
          }),
        }),
      }),
    }));

    const res = await service.getSellerStats(20);
    expect(itemRepo.count).toHaveBeenCalledWith({ where: { sellerId: 20 } });
    expect(chatRepo.count).toHaveBeenCalled();
    expect(res).toEqual({
      productsCount: 5,
      activeChatsCount: 4,
      averageRating: 4.5,
      totalSales: 123.4,
    });
  });

  it('getAdminStats returns global counts', async () => {
    (userRepo.count as any).mockResolvedValue(10);
    (incidentRepo.count as any).mockResolvedValue(2);
    (reportRepo.count as any).mockResolvedValue(7);
    (itemRepo.count as any).mockResolvedValue(15);
    const res = await service.getAdminStats();
    expect(res).toEqual({ usersCount: 10, incidentsCount: 2, reportsCount: 7, productsCount: 15 });
  });
});
