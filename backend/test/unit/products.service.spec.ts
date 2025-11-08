import { ProductsService } from '../../src/products/products.service';
import { Repository } from 'typeorm';
import { Item } from '../../src/entities/item.entity';
import { ItemPhoto } from '../../src/entities/item-photo.entity';
import { Service as ServiceEntity } from '../../src/entities/service.entity';
import { Favorite } from '../../src/entities/favorite.entity';
import { IncidentsService } from '../../src/incidents/incidents.service';
import { NotFoundException } from '@nestjs/common';

describe('ProductsService (unit)', () => {
  let service: ProductsService;
  let itemRepo: jest.Mocked<Repository<Item>>;
  let photoRepo: jest.Mocked<Repository<ItemPhoto>>;
  let serviceRepo: jest.Mocked<Repository<ServiceEntity>>;
  let favRepo: jest.Mocked<Repository<Favorite>>;
  let incidentsService: jest.Mocked<IncidentsService>;

  beforeEach(() => {
    // crear mocks completos para evitar errores por métodos faltantes
    itemRepo = {
      createQueryBuilder: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    } as any;

    photoRepo = {
      create: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    serviceRepo = {
      create: jest.fn(),
      save: jest.fn(),
      upsert: jest.fn(),
    } as any;

    favRepo = {
      findOne: jest.fn(),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as any;

    incidentsService = {
      createIncident: jest.fn(),
    } as any;

    service = new ProductsService(itemRepo, photoRepo, serviceRepo, favRepo, incidentsService);
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

  it('create debería guardar item y devolver el item completo (sin imágenes)', async () => {
    const dto: any = { name: 'New', description: 'Desc', type: 'product', price: 10 };
    const saved = { itemId: 5, ...dto } as any;

    // generateUniqueCode hace findOne para comprobar existencia -> no existe
    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

    // save/create behavior
    (itemRepo.create as jest.Mock).mockReturnValue(saved);
    (itemRepo.save as jest.Mock).mockResolvedValueOnce(saved);

    // la llamada final a findOne desde create()->findOne
    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(saved);

    const res = await service.create(dto, {}, 10);
    expect(itemRepo.create).toHaveBeenCalled();
    expect(itemRepo.save).toHaveBeenCalled();
    expect(res).toBe(saved);
  });

  it('create debería detectar contenido peligroso y crear incidente automáticamente', async () => {
    const dangerousDto: any = { name: 'Arma de fuego', description: 'Pistola para venta', type: 'product', price: 100 };
    const saved = { itemId: 6, ...dangerousDto, status: 'pending' } as any;

    // generateUniqueCode hace findOne para comprobar existencia -> no existe
    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(null);

    // save/create behavior for dangerous product
    (itemRepo.create as jest.Mock).mockReturnValue(saved);
    (itemRepo.save as jest.Mock).mockResolvedValueOnce(saved);
    (incidentsService.createIncident as jest.Mock).mockResolvedValueOnce({ incidentId: 1 });

    // la llamada final a findOne desde create()->findOne
    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(saved);

    const res = await service.create(dangerousDto, {}, 10);
    
    expect(itemRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      status: 'pending' // Should be set to pending due to dangerous content
    }));
    expect(incidentsService.createIncident).toHaveBeenCalledWith(
      6,
      expect.stringContaining('Producto detectado automáticamente como potencialmente peligroso')
    );
    expect(res).toBe(saved);
  });

  it('findBySeller debería devolver lista de productos de un vendedor', async () => {
    const list = [{ itemId: 1 }, { itemId: 2 }];
    (itemRepo.find as jest.Mock).mockResolvedValueOnce(list);

    const res = await service.findBySeller(42);
    expect(itemRepo.find).toHaveBeenCalledWith({ where: { sellerId: 42 }, relations: ["photos", "service"] });
    expect(res).toBe(list);
  });

  it('update debería lanzar ForbiddenException si otro usuario intenta actualizar', async () => {
    const item = { itemId: 7, sellerId: 1, type: 'product' } as any;
    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(item);

    await expect(
      service.update(7, { name: 'X' } as any, {}, { userId: 2 } as any),
    ).rejects.toThrow('You can only update your own products');
  });

  it('remove debería lanzar ForbiddenException si otro usuario intenta borrar y también si está BANNED', async () => {
    const item = { itemId: 9, sellerId: 1, status: 'ACTIVE' } as any;
    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(item);

    await expect(service.remove(9, { userId: 2 } as any)).rejects.toThrow('You can only delete your own products');

  const banned = { itemId: 10, sellerId: 1, status: 'banned' } as any;
    (itemRepo.findOne as jest.Mock).mockResolvedValueOnce(banned);
    await expect(service.remove(10, { userId: 1 } as any)).rejects.toThrow('Banned products cannot be deleted');
  });

  it('toggleFavorite debería alternar favorito correctamente', async () => {
    // caso: ya existe -> se elimina
    (favRepo.findOne as jest.Mock).mockResolvedValueOnce({ itemId: 1, userId: 2 } as any);
    (favRepo.delete as jest.Mock).mockResolvedValue(undefined as any);

    let res = await service.toggleFavorite(1, 2);
    expect(favRepo.delete).toHaveBeenCalledWith({ itemId: 1, userId: 2 });
    expect(res.isFavorite).toBe(false);

    // caso: no existe -> se guarda
    (favRepo.findOne as jest.Mock).mockResolvedValueOnce(null);
    (favRepo.save as jest.Mock).mockResolvedValue({ itemId: 1, userId: 2 } as any);

    res = await service.toggleFavorite(1, 2);
    expect(favRepo.save).toHaveBeenCalledWith({ itemId: 1, userId: 2 });
    expect(res.isFavorite).toBe(true);
  });

  it('getFavorites debería devolver items desde favoritos y mapear a item', async () => {
    const favs = [
      { item: { itemId: 1, name: 'A' } },
      { item: { itemId: 2, name: 'B' } },
    ] as any;
    (favRepo.find as jest.Mock).mockResolvedValueOnce(favs);

    const res = await service.getFavorites(100);
    expect(favRepo.find).toHaveBeenCalledWith({ where: { user: { userId: 100 } }, relations: ["item", "item.seller", "item.photos"] });
    expect(res).toEqual([{ itemId: 1, name: 'A' }, { itemId: 2, name: 'B' }]);
  });
});
