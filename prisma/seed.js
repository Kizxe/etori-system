const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.storageLocation.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created admin user: ${admin.email}`);

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10);
  const staff = await prisma.user.create({
    data: {
      name: 'Staff User',
      email: 'staff@example.com',
      password: staffPassword,
      role: 'STAFF',
    },
  });
  console.log(`Created staff user: ${staff.email}`);

  // Seed categories
  const categoryNames = [
    'Printers',
    'Toners',
    'Inks',
    'Desktops',
    'Computers',
  ];

  const categories = await Promise.all(
    categoryNames.map((name) =>
      prisma.category.create({
        data: { name },
      })
    )
  );

  const nameToCategoryId = Object.fromEntries(categories.map((c) => [c.name, c.id]));

  // Seed products with example inventory
  await prisma.product.create({
    data: {
      name: 'Brother HL-L2395DW Monochrome Laser Printer',
      sku: 'SKU-PRN-BRO-HLL2395DW',
      barcode: 'BR-HLL2395DW',
      description: 'Wireless monochrome laser printer with scanner and copier',
      category: { connect: { id: nameToCategoryId['Printers'] } },
      manufacturer: 'Brother',
      model: 'HL-L2395DW',
      price: '899.00',
      minimumStock: 2,
      locations: {
        create: [
          { name: 'Warehouse A', quantity: 5 },
          { name: 'Showroom', quantity: 1 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'HP OfficeJet Pro 9025e All-in-One Inkjet Printer',
      sku: 'SKU-PRN-HP-9025E',
      barcode: 'HP-9025E',
      description: 'Fast color inkjet AIO with duplex printing and Wi‑Fi',
      category: { connect: { id: nameToCategoryId['Printers'] } },
      manufacturer: 'HP',
      model: 'OfficeJet Pro 9025e',
      price: '1299.00',
      minimumStock: 2,
      locations: {
        create: [
          { name: 'Warehouse B', quantity: 3 },
          { name: 'Showroom', quantity: 1 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Canon PIXMA G3020 MegaTank Printer',
      sku: 'SKU-PRN-CAN-G3020',
      barcode: 'CAN-G3020',
      description: 'Ink tank printer with low running cost and Wi‑Fi',
      category: { connect: { id: nameToCategoryId['Printers'] } },
      manufacturer: 'Canon',
      model: 'PIXMA G3020',
      price: '799.00',
      minimumStock: 2,
      locations: {
        create: [
          { name: 'Warehouse A', quantity: 4 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Brother TN-248 Black Toner',
      sku: 'SKU-TON-BRO-TN248-BK',
      barcode: 'BR-TN248-BK',
      description: 'Original Brother black toner cartridge',
      category: { connect: { id: nameToCategoryId['Toners'] } },
      manufacturer: 'Brother',
      model: 'TN-248 BK',
      price: '259.00',
      minimumStock: 10,
      locations: {
        create: [
          { name: 'Warehouse A', quantity: 20 },
          { name: 'Warehouse B', quantity: 10 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'HP 206A Cyan Toner Cartridge',
      sku: 'SKU-TON-HP-206A-C',
      barcode: 'HP-206A-C',
      description: 'Original HP cyan toner cartridge',
      category: { connect: { id: nameToCategoryId['Toners'] } },
      manufacturer: 'HP',
      model: '206A Cyan',
      price: '349.00',
      minimumStock: 8,
      locations: {
        create: [
          { name: 'Warehouse A', quantity: 12 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Canon GI‑790 Black Ink Bottle',
      sku: 'SKU-INK-CAN-GI790-BK',
      barcode: 'CAN-GI790-BK',
      description: 'Genuine Canon MegaTank black ink bottle',
      category: { connect: { id: nameToCategoryId['Inks'] } },
      manufacturer: 'Canon',
      model: 'GI‑790 BK',
      price: '35.00',
      minimumStock: 15,
      locations: {
        create: [
          { name: 'Warehouse A', quantity: 30 },
          { name: 'Warehouse B', quantity: 15 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'HP 963XL High Yield Black Ink Cartridge',
      sku: 'SKU-INK-HP-963XL-BK',
      barcode: 'HP-963XL-BK',
      description: 'High yield black ink for compatible OfficeJet Pro models',
      category: { connect: { id: nameToCategoryId['Inks'] } },
      manufacturer: 'HP',
      model: '963XL Black',
      price: '199.00',
      minimumStock: 10,
      locations: {
        create: [
          { name: 'Warehouse B', quantity: 18 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Dell OptiPlex 7010 SFF i5‑13500 16GB 512GB',
      sku: 'SKU-DES-DELL-7010-SFF',
      barcode: 'DELL-7010-SFF',
      description: 'Business desktop small form factor with 13th Gen Intel Core i5',
      category: { connect: { id: nameToCategoryId['Desktops'] } },
      manufacturer: 'Dell',
      model: 'OptiPlex 7010 SFF',
      price: '2999.00',
      minimumStock: 3,
      locations: {
        create: [
          { name: 'Warehouse A', quantity: 2 },
          { name: 'Warehouse B', quantity: 2 },
        ],
      },
    },
  });

  await prisma.product.create({
    data: {
      name: 'Lenovo ThinkPad E14 Gen 5 i7‑1355U 16GB 512GB',
      sku: 'SKU-COM-LEN-E14-G5-I7',
      barcode: 'LEN-E14-G5-I7',
      description: '14" business laptop with Intel Core i7 and SSD',
      category: { connect: { id: nameToCategoryId['Computers'] } },
      manufacturer: 'Lenovo',
      model: 'ThinkPad E14 Gen 5',
      price: '4599.00',
      minimumStock: 2,
      locations: {
        create: [
          { name: 'Warehouse A', quantity: 3 },
        ],
      },
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 