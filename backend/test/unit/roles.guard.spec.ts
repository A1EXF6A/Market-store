import { RolesGuard } from '../../src/common/guards/roles.guard';
import { Reflector } from '@nestjs/core';

function makeContext(user: any = {}, requiredRoles?: string[]) {
  const reflector = new Reflector();
  const guard = new RolesGuard(reflector as any);
  const ctx: any = {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => ({}),
    getClass: () => function TestClass() {},
  };
  if (typeof requiredRoles !== 'undefined') {
    jest.spyOn(reflector as any, 'getAllAndOverride').mockReturnValue(requiredRoles);
  }
  return { guard, ctx };
}

describe('RolesGuard', () => {
  it('permite cuando no hay roles requeridos', () => {
    const { guard, ctx } = makeContext({ role: ['seller'] });
    expect(guard.canActivate(ctx as any)).toBe(true);
  });

  it('niega cuando el usuario no cumple con roles', () => {
    const { guard, ctx } = makeContext({ role: ['buyer'] }, ['admin']);
    expect(guard.canActivate(ctx as any)).toBe(false);
  });

  it('permite cuando el usuario tiene alguno de los roles requeridos', () => {
    const { guard, ctx } = makeContext({ role: ['admin', 'seller'] }, ['seller']);
    expect(guard.canActivate(ctx as any)).toBe(true);
  });
});
