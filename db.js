require('dotenv').config();                // Carga variables desde .env
const { Database } = require('@sqlitecloud/drivers');

const connectionString = process.env.SQLITECLOUD_URL;
if (!connectionString) {
  console.error('❌ Falta SQLITECLOUD_URL en .env');
  process.exit(1);
}

// Instancia el cliente; el driver maneja la conexión internamente
const db = new Database(connectionString);

// Cierra la conexión de manera ordenada al terminar el proceso
process.on('SIGINT', async () => {
  await db.close();
  console.log('🔌 Conexión a SQLite Cloud cerrada');
  process.exit();
});

module.exports = db;
