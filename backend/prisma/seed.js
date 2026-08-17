import 'dotenv/config';
import pkg from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const { PrismaClient } = pkg;
//kinukuha ‘yong "tool" na kausap natin ang database. Ito ‘yong auto-generated code na ginawa ni Prisma base sa schema mo.

// Bagong requirement sa Prisma 7: kailangan ng "driver adapter"
// para malaman ni Prisma kung paano talaga kokonekta sa Postgres
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter }); //irektang tumutugma ‘to sa model Category sa schema mo. Tandaan ‘yong fields ng Category: id (auto), name (ito ang binibigay natin), products (relation, wala tayong lagay dito), createdAt (auto). Kaya ang kailangan lang nating i-provide ay name — lahat ng iba, awtomatiko nang gagawin ni Prisma.

async function main() {
  const categories = ['Beverages', 'Food', 'NonFood', 'Frozen', 'Snacks'];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name }, //"hanapin mo kung may existing na category na may ganitong pangalan"
      update: {}, //kung meron, wag mo nang baguhin" (blangko lang)
      create: { name }, //"kung wala, gawin mo ‘yong bago gamit ‘tong pangalan"
    });
    console.log(`✔ Category ready: ${name}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });