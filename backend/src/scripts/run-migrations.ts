import AppDataSource from "../data-source";

async function runMigrations() {
  await AppDataSource.initialize();
  const result = await AppDataSource.runMigrations();
  console.log("Migraciones aplicadas:", result);
  await AppDataSource.destroy();
}

runMigrations().catch((err) => {
  console.error("❌ Error al correr migraciones:", err);
  process.exit(1);
});
