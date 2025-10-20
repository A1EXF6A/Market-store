import { ProductsService } from '../../src/products/products.service';
import { Repository } from 'typeorm';
import { Item } from '../../src/entities/item.entity';
import { ItemPhoto } from '../../src/entities/item-photo.entity';
import { Service as ServiceEntity } from '../../src/entities/service.entity';
import { Favorite } from '../../src/entities/favorite.entity';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService (unit)', () => {
  let service: ProductsService;
  let itemRepo: jest.Mocked<Repository<Item>>;
  let photoRepo: jest.Mocked<Repository<ItemPhoto>>;
  let serviceRepo: jest.Mocked<Repository<ServiceEntity>>;
  let favRepo: jest.Mocked<Repository<Favorite>>;

  beforeEach(() => {
    itemRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
    } as any;
    photoRepo = {} as any;
    serviceRepo = {} as any;
    favRepo = {} as any;

    service = new ProductsService(itemRepo, photoRepo, serviceRepo, favRepo);
  });

  it('findOne debería devolver item existente o lanzar NotFoundException', async () => {
    const item = { itemId: 1, name: 'P1' } as any;
    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(item);
    const res = await service.findOne(1);
    expect(res).toBe(item);

    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
  });

  it('findAll debería construir queries con filtros y devolver lista', async () => {
    // Mock simple query builder with chaining
    const getMany = jest.fn().mockResolvedValue([{ itemId: 1 }]);
    const where = jest.fn(() => ({ andWhere, getMany } as any));
    const andWhere = jest.fn(() => ({ andWhere, getMany } as any));

    const qb = {
      leftJoinAndSelect: jest.fn(() => qb),
      where: jest.fn(() => qb),
      andWhere: andWhere,
      getMany,
    } as any;

    (itemRepo.createQueryBuilder as jest.Mock).mockReturnValue(qb);

    const res = await service.findAll({ type: 'product', minPrice: 10, maxPrice: 100, location: 'City' });
    expect(res).toEqual([{ itemId: 1 }]);
    expect(itemRepo.createQueryBuilder).toHaveBeenCalled();
  });
});
