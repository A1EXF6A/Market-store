import { JwtStrategy } from '../../src/auth/jwt.strategy';

describe('JwtStrategy', () => {
  it('valida payload devolviendo usuario simple', async () => {
    const config = { get: jest.fn().mockReturnValue('secret') } as any;
    const strategy = new JwtStrategy(config);
    // Stub UsersService used inside strategy to return a basic user
    (strategy as any).usersService = { findById: jest.fn().mockResolvedValue({ userId: 1, email: 'a@b.c', role: ['seller'] }) };
    const payload = { sub: 1, email: 'a@b.c', role: ['seller'] } as any;
    const res = await (strategy as any).validate(payload);
    expect(res.userId).toBe(1);
    expect(res.email).toBe('a@b.c');
    expect(res.role).toEqual(['seller']);
  });
});
