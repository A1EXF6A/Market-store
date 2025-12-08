import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, HttpStatus } from '@nestjs/common';
import * as request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User } from '../../src/entities/user.entity';

describe('CM-FN04 - Validación de contraseña fuerte', () => {
  let app: INestApplication;
  let userRepo: Repository<User>;

  const weakPassword = '12345'; // Contraseña débil
  const testEmail = `fn04_user_${Date.now()}@test.com`;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: '127.0.0.1',
          port: 5432,
          username: 'postgres',
          password: 'Youpikne/47',
          database: 'sistema_ventas',
          synchronize: false,
          logging: false,
          entities: [User],
        }),
        TypeOrmModule.forFeature([User]),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    userRepo = moduleRef.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    // Eliminar usuario de prueba si fue creado
    await userRepo.delete({ email: testEmail });
    await app.close();
  });

  // -------------------------------------------------------------
  // PASO 1 → Crear usuario con contraseña débil
  // -------------------------------------------------------------
  it('Paso 1: Intentar crear un usuario con contraseña débil', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register') // Ajusta si tu endpoint es distinto
      .send({
        email: testEmail,
        password: weakPassword,
        name: 'Usuario FN04',
      });

    // Resultado esperado: rechazo de contraseña débil
    expect(res.status).toBe(HttpStatus.BAD_REQUEST); 
    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toContain('contraseña'); // mensaje de validación
  });

  // -------------------------------------------------------------
  // PASO 2 → Revisar los mensajes de error
  // -------------------------------------------------------------
  it('Paso 2: Revisar los mensajes de validación de contraseña', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: weakPassword,
        name: 'Usuario FN04',
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.message).toContain('contraseña'); // El mensaje indica que es débil
  });

  // -------------------------------------------------------------
  // PASO 3 → Intentar crear de nuevo con contraseña débil
  // -------------------------------------------------------------
  it('Paso 3: Crear un usuario nuevamente con contraseña débil debe fallar', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email: testEmail,
        password: weakPassword,
        name: 'Usuario FN04',
      });

    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.message).toContain('contraseña'); // sigue validando correctamente
  });
});
