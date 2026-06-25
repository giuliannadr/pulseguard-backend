const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

try {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  console.log('Adapter created with connectionString:', !!adapter);
} catch (e) {
  console.error('Error with connectionString:', e.message);
}

try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter2 = new PrismaPg(pool);
  console.log('Adapter created with pool:', !!adapter2);
} catch (e) {
  console.error('Error with pool:', e.message);
}
