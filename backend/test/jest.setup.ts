// Jest setup file - se ejecuta ANTES de cargar cualquier módulo

// Configurar NODE_ENV antes de que cualquier módulo se cargue
process.env.NODE_ENV = 'test';

// Cargar variables de entorno de test
try {
  process.loadEnvFile('.env.test');
} catch (error) {
  console.warn('Could not load .env.test file');
}