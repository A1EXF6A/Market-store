import { UsersService } from '../../src/users/users.service';
import { Repository } from 'typeorm';
import { User, UserStatus, UserRole } from '../../src/entities/user.entity';
jest.mock('bcryptjs', () => ({
  compare: jest.fn(async () => true),
  hash: jest.fn(async () => 'hashed'),
}));

function mockRepo<T>() {
  return {
    findOne: jest.fn(),
    save: jest.fn(async (e: any) => e),
    update: jest.fn(async () => ({})),
    createQueryBuilder: jest.fn(() => ({
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getMany: jest.fn(async () => []),
    })),
  } as unknown as Repository<T>;
}

describe('UsersService (unit)', () => {
  let service: UsersService;
  let repo: Repository<User>;

  beforeEach(() => {
    repo = mockRepo<User>();
    service = new UsersService(repo as any);
  });

  it('findById throws when missing', async () => {
    (repo as any).findOne.mockResolvedValue(undefined);
    await expect(service.findById(1)).rejects.toThrow('User not found');
  });

  it('updateUserStatus sets suspendedUntil only when suspended', async () => {
    (repo as any).findOne.mockResolvedValue({ userId: 1, status: UserStatus.ACTIVE } as any);
    const updated = await service.updateUserStatus(1, UserStatus.SUSPENDED, new Date('2030-01-01'));
    expect(updated.status).toBe(UserStatus.SUSPENDED);
    expect(updated.suspendedUntil).toBeTruthy();

    (repo as any).findOne.mockResolvedValue({ userId: 1, status: UserStatus.SUSPENDED, suspendedUntil: new Date() } as any);
    const cleared = await service.updateUserStatus(1, UserStatus.ACTIVE);
    expect(cleared.status).toBe(UserStatus.ACTIVE);
    expect(cleared.suspendedUntil).toBeNull();
  });

  it('verifyUser sets verified=true', async () => {
    (repo as any).findOne.mockResolvedValue({ userId: 1, verified: false } as any);
    const res = await service.verifyUser(1);
    expect(res.verified).toBe(true);
    expect((repo as any).save).toHaveBeenCalled();
  });

  it('updateUser throws conflict when email exists', async () => {
    (repo as any).findOne
      .mockResolvedValueOnce({ userId: 1, email: 'a@b.c' } as any) // findById
      .mockResolvedValueOnce({ userId: 2, email: 'c@d.e' } as any); // existing email
    await expect(service.updateUser(1, { email: 'c@d.e' } as any)).rejects.toThrow('Email already in use');
  });

  it('changePassword updates hash when current correct', async () => {
    (repo as any).findOne.mockResolvedValue({ userId: 1, passwordHash: 'x' } as any);
    await service.changePassword(1, { currentPassword: 'old', newPassword: 'new' } as any);
    expect((repo as any).save).toHaveBeenCalledWith(expect.objectContaining({ passwordHash: 'hashed' }));
  });

  it('updateUserRole updates role', async () => {
    (repo as any).findOne.mockResolvedValue({ userId: 1, role: UserRole.BUYER } as any);
    const res = await service.updateUserRole(1, UserRole.SELLER);
    expect(res.role).toBe(UserRole.SELLER);
  });

  it('deleteUser soft deletes user', async () => {
    (repo as any).findOne.mockResolvedValue({ userId: 1, deleted: false } as any);
    await service.deleteUser(1);
    expect((repo as any).save).toHaveBeenCalledWith(expect.objectContaining({ deleted: true }));
  });

  it('updateUser updates basic fields', async () => {
    (repo as any).findOne.mockResolvedValue({ userId: 1, email: 'x@y.z', firstName: 'Old' });
    const res = await (service as any).updateUser(1, { firstName: 'A', lastName: 'B' });
    expect((repo as any).save).toHaveBeenCalledWith(expect.objectContaining({ firstName: 'A', lastName: 'B' }));
    expect(res).toBeDefined();
  });
});

