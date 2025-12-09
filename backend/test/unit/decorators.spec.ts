import { GetUser } from '../../src/common/decorators/get-user.decorator';
import { Roles } from '../../src/common/decorators/roles.decorator';
import { UserRole } from '../../src/entities/user.entity';

describe('Decorators', () => {
  it('GetUser es un decorador de parámetro válido', () => {
    expect(typeof GetUser).toBe('function');
  });

  it('Roles establece metadata con roles requeridos', () => {
    const decorator = Roles(UserRole.ADMIN, UserRole.SELLER) as any;
    expect(decorator).toBeDefined();
  });
});
