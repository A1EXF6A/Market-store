// Setup file para tests - configura el entorno antes de ejecutar las pruebas

// Asegurar que NODE_ENV esté configurado correctamente
process.env.NODE_ENV = 'test';

// Cargar variables de entorno para tests
const envFile = '.env.test';
try {
  process.loadEnvFile(envFile);
  console.log('✅ Test environment loaded from', envFile);
  console.log('🗄️ Database:', process.env.DB_HOST || 'localhost');
  
  // Limpiar el cache del módulo env para forzar recarga
  const envPath = require.resolve('../src/config/env');
  delete require.cache[envPath];
  
} catch (error) {
  console.log('⚠️ Warning: Could not load', envFile, '- using defaults');
}