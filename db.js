require('dotenv').config();
const { Database } = require('@sqlitecloud/drivers');

const connectionString = process.env.SQLITECLOUD_URL;
if (!connectionString) {
  console.error(' Falta SQLITECLOUD_URL en .env');
  process.exit(1);
}

const db = new Database(connectionString);

process.on('SIGINT', async () => {
  await db.close();
  console.log('🔌 Conexión a SQLite Cloud cerrada');
  process.exit();
});

module.exports = db;