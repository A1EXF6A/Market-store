import type { Config } from 'jest';

const config: Config = {
  // 📌 Usa ts-jest para interpretar archivos TypeScript
  preset: 'ts-jest',

  // 🧪 Entorno de pruebas en Node
  testEnvironment: 'node',

  // 📁 Extensiones válidas
  moduleFileExtensions: ['js', 'json', 'ts'],

  // 📍 Carpeta raíz
  rootDir: '.',

  // 🧪 Detecta todos los archivos que terminan en `.spec.ts` o `.test.ts`
  testRegex: '.*\\.(spec|test)\\.ts$',

  // 🛠️ Transforma TS a JS en tiempo de prueba
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },

  // 📊 Carpeta donde se guardarán los reportes de cobertura
  coverageDirectory: './coverage',

  // ✅ Ignora ciertas carpetas innecesarias para las pruebas
  testPathIgnorePatterns: ['/node_modules/', '/dist/'],

  // 📌 Mapea paths de TypeScript si usas "paths" en tsconfig.json
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  // 🧭 Configuración útil si usas Testcontainers (para evitar timeout por Docker)
  testTimeout: 180000, // 60 segundos

  // 🧪 Corre las pruebas de forma secuencial si es necesario (útil con Docker)
  maxWorkers: 1,

  // 🧼 Limpia mocks entre pruebas unitarias
  clearMocks: true,

  // 🧪 Puedes agregar setup si lo necesitas
  // setupFilesAfterEnv: ['<rootDir>/test/setup.ts'],

  
};

export default config;
