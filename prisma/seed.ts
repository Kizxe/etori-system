import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.stockRequest.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.serialNumber.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.storageLocation.deleteMany({})
  await prisma.user.deleteMany({})

  // Create storage locations
  const warehouse = await prisma.storageLocation.create({
    data: {
      name: 'Main Warehouse',
      description: 'Primary storage facility for all inventory'
    }
  })

  const officeStorage = await prisma.storageLocation.create({
    data: {
      name: 'Office Storage',
      description: 'Storage area within the office building'
    }
  })

  const serverRoom = await prisma.storageLocation.create({
    data: {
      name: 'Server Room',
      description: 'Secure storage for high-value IT equipment'
    }
  })

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Printers' } }),
    prisma.category.create({ data: { name: 'Desktops' } }),
    prisma.category.create({ data: { name: 'Laptops' } }),
    prisma.category.create({ data: { name: 'Toner' } }),
    prisma.category.create({ data: { name: 'Ink' } }),
    prisma.category.create({ data: { name: 'Drums' } })
  ])

  // Create products with realistic data
  const products = [
    // Printers
    {
      name: 'HP LaserJet Pro M404n',
      sku: 'PRT-HP-M404N-001',
      barcode: '1234567890123',
      description: 'Monochrome laser printer with network connectivity, 40 ppm print speed',
      categoryId: categories[0].id,
      manufacturer: 'HP',
      model: 'LaserJet Pro M404n',
      price: 299.99,
      minimumStock: 2
    },
    {
      name: 'Canon PIXMA TS8320',
      sku: 'PRT-CAN-TS8320-001',
      barcode: '1234567890124',
      description: 'All-in-one wireless inkjet printer with 6-color printing system',
      categoryId: categories[0].id,
      manufacturer: 'Canon',
      model: 'PIXMA TS8320',
      price: 199.99,
      minimumStock: 3
    },
    {
      name: 'Brother HL-L2350DW',
      sku: 'PRT-BRO-HL2350DW-001',
      barcode: '1234567890125',
      description: 'Monochrome laser printer with wireless networking and duplex printing',
      categoryId: categories[0].id,
      manufacturer: 'Brother',
      model: 'HL-L2350DW',
      price: 159.99,
      minimumStock: 2
    },
    {
      name: 'Epson EcoTank ET-4760',
      sku: 'PRT-EPS-ET4760-001',
      barcode: '1234567890141',
      description: 'All-in-one inkjet printer with refillable ink tanks, wireless connectivity',
      categoryId: categories[0].id,
      manufacturer: 'Epson',
      model: 'EcoTank ET-4760',
      price: 349.99,
      minimumStock: 2
    },
    {
      name: 'HP OfficeJet Pro 9015',
      sku: 'PRT-HP-OJ9015-001',
      barcode: '1234567890142',
      description: 'All-in-one business inkjet printer with automatic document feeder',
      categoryId: categories[0].id,
      manufacturer: 'HP',
      model: 'OfficeJet Pro 9015',
      price: 399.99,
      minimumStock: 1
    },

    // Desktops
    {
      name: 'Dell OptiPlex 7090',
      sku: 'DESK-DELL-7090-001',
      barcode: '1234567890126',
      description: 'Business desktop with Intel Core i7, 16GB RAM, 512GB SSD',
      categoryId: categories[1].id,
      manufacturer: 'Dell',
      model: 'OptiPlex 7090',
      price: 899.99,
      minimumStock: 1
    },
    {
      name: 'HP EliteDesk 800 G5',
      sku: 'DESK-HP-800G5-001',
      barcode: '1234567890127',
      description: 'Professional desktop with Intel Core i5, 8GB RAM, 256GB SSD',
      categoryId: categories[1].id,
      manufacturer: 'HP',
      model: 'EliteDesk 800 G5',
      price: 649.99,
      minimumStock: 2
    },
    {
      name: 'Lenovo ThinkCentre M90t',
      sku: 'DESK-LEN-M90T-001',
      barcode: '1234567890128',
      description: 'Enterprise desktop with Intel Core i3, 4GB RAM, 1TB HDD',
      categoryId: categories[1].id,
      manufacturer: 'Lenovo',
      model: 'ThinkCentre M90t',
      price: 449.99,
      minimumStock: 3
    },
    {
      name: 'Apple iMac 24" M1',
      sku: 'DESK-APP-IMAC24M1-001',
      barcode: '1234567890143',
      description: 'All-in-one desktop with Apple M1 chip, 8GB RAM, 256GB SSD',
      categoryId: categories[1].id,
      manufacturer: 'Apple',
      model: 'iMac 24" M1',
      price: 1299.99,
      minimumStock: 1
    },
    {
      name: 'ASUS ProArt StudioBook',
      sku: 'DESK-ASU-PROART-001',
      barcode: '1234567890144',
      description: 'Professional desktop with Intel Core i9, 32GB RAM, 1TB SSD',
      categoryId: categories[1].id,
      manufacturer: 'ASUS',
      model: 'ProArt StudioBook',
      price: 1899.99,
      minimumStock: 1
    },

    // Laptops
    {
      name: 'Dell Latitude 5520',
      sku: 'LAP-DELL-5520-001',
      barcode: '1234567890129',
      description: 'Business laptop with Intel Core i7, 16GB RAM, 512GB SSD, 15.6" display',
      categoryId: categories[2].id,
      manufacturer: 'Dell',
      model: 'Latitude 5520',
      price: 1299.99,
      minimumStock: 1
    },
    {
      name: 'HP EliteBook 840 G8',
      sku: 'LAP-HP-840G8-001',
      barcode: '1234567890130',
      description: 'Professional laptop with Intel Core i5, 8GB RAM, 256GB SSD, 14" display',
      categoryId: categories[2].id,
      manufacturer: 'HP',
      model: 'EliteBook 840 G8',
      price: 999.99,
      minimumStock: 2
    },
    {
      name: 'Lenovo ThinkPad T14',
      sku: 'LAP-LEN-T14-001',
      barcode: '1234567890131',
      description: 'Enterprise laptop with AMD Ryzen 5, 16GB RAM, 512GB SSD, 14" display',
      categoryId: categories[2].id,
      manufacturer: 'Lenovo',
      model: 'ThinkPad T14',
      price: 1199.99,
      minimumStock: 1
    },
    {
      name: 'Apple MacBook Pro 13" M2',
      sku: 'LAP-APP-MBP13M2-001',
      barcode: '1234567890145',
      description: 'Professional laptop with Apple M2 chip, 8GB RAM, 256GB SSD',
      categoryId: categories[2].id,
      manufacturer: 'Apple',
      model: 'MacBook Pro 13" M2',
      price: 1499.99,
      minimumStock: 1
    },
    {
      name: 'ASUS ROG Zephyrus G14',
      sku: 'LAP-ASU-ROGG14-001',
      barcode: '1234567890146',
      description: 'Gaming laptop with AMD Ryzen 9, 16GB RAM, 1TB SSD, RTX 3060',
      categoryId: categories[2].id,
      manufacturer: 'ASUS',
      model: 'ROG Zephyrus G14',
      price: 1699.99,
      minimumStock: 1
    },

    // Toner
    {
      name: 'HP 26A Black Toner Cartridge',
      sku: 'TON-HP-26A-001',
      barcode: '1234567890132',
      description: 'High-yield black toner cartridge for HP LaserJet printers, yields up to 2,500 pages',
      categoryId: categories[3].id,
      manufacturer: 'HP',
      model: '26A',
      price: 89.99,
      minimumStock: 10
    },
    {
      name: 'Canon 052 Black Toner',
      sku: 'TON-CAN-052-001',
      barcode: '1234567890133',
      description: 'Black toner cartridge for Canon imageRUNNER printers, yields up to 6,000 pages',
      categoryId: categories[3].id,
      manufacturer: 'Canon',
      model: '052',
      price: 129.99,
      minimumStock: 8
    },
    {
      name: 'Brother TN-660 Black Toner',
      sku: 'TON-BRO-TN660-001',
      barcode: '1234567890134',
      description: 'Black toner cartridge for Brother HL-L2300 series printers, yields up to 1,200 pages',
      categoryId: categories[3].id,
      manufacturer: 'Brother',
      model: 'TN-660',
      price: 49.99,
      minimumStock: 15
    },
    {
      name: 'Epson 101 Black Toner',
      sku: 'TON-EPS-101-001',
      barcode: '1234567890147',
      description: 'Black toner cartridge for Epson laser printers, yields up to 1,500 pages',
      categoryId: categories[3].id,
      manufacturer: 'Epson',
      model: '101',
      price: 69.99,
      minimumStock: 12
    },
    {
      name: 'HP 49A Black Toner Cartridge',
      sku: 'TON-HP-49A-001',
      barcode: '1234567890148',
      description: 'High-yield black toner for HP LaserJet Pro printers, yields up to 3,000 pages',
      categoryId: categories[3].id,
      manufacturer: 'HP',
      model: '49A',
      price: 109.99,
      minimumStock: 8
    },

    // Ink
    {
      name: 'HP 65 Black Ink Cartridge',
      sku: 'INK-HP-65-001',
      barcode: '1234567890135',
      description: 'Black ink cartridge for HP DeskJet and ENVY printers, yields up to 120 pages',
      categoryId: categories[4].id,
      manufacturer: 'HP',
      model: '65',
      price: 24.99,
      minimumStock: 25
    },
    {
      name: 'Canon PG-245 Black Ink',
      sku: 'INK-CAN-PG245-001',
      barcode: '1234567890136',
      description: 'Black ink cartridge for Canon PIXMA printers, yields up to 180 pages',
      categoryId: categories[4].id,
      manufacturer: 'Canon',
      model: 'PG-245',
      price: 19.99,
      minimumStock: 30
    },
    {
      name: 'Epson 101 Black Ink',
      sku: 'INK-EPS-101-001',
      barcode: '1234567890137',
      description: 'Black ink cartridge for Epson Expression printers, yields up to 200 pages',
      categoryId: categories[4].id,
      manufacturer: 'Epson',
      model: '101',
      price: 22.99,
      minimumStock: 20
    },
    {
      name: 'HP 67 Tri-Color Ink Cartridge',
      sku: 'INK-HP-67-001',
      barcode: '1234567890149',
      description: 'Tri-color ink cartridge for HP DeskJet printers, includes cyan, magenta, yellow',
      categoryId: categories[4].id,
      manufacturer: 'HP',
      model: '67',
      price: 34.99,
      minimumStock: 18
    },
    {
      name: 'Canon CL-246 Color Ink',
      sku: 'INK-CAN-CL246-001',
      barcode: '1234567890150',
      description: 'Color ink cartridge for Canon PIXMA printers, includes all colors',
      categoryId: categories[4].id,
      manufacturer: 'Canon',
      model: 'CL-246',
      price: 29.99,
      minimumStock: 22
    },

    // Drums
    {
      name: 'HP 26A Imaging Drum Unit',
      sku: 'DRUM-HP-26A-001',
      barcode: '1234567890138',
      description: 'Imaging drum unit for HP LaserJet printers, replaceable component for consistent print quality',
      categoryId: categories[5].id,
      manufacturer: 'HP',
      model: '26A',
      price: 149.99,
      minimumStock: 5
    },
    {
      name: 'Canon 052 Drum Unit',
      sku: 'DRUM-CAN-052-001',
      barcode: '1234567890139',
      description: 'Drum unit for Canon imageRUNNER printers, ensures optimal print performance',
      categoryId: categories[5].id,
      manufacturer: 'Canon',
      model: '052',
      price: 199.99,
      minimumStock: 3
    },
    {
      name: 'Brother DR-660 Drum Unit',
      sku: 'DRUM-BRO-DR660-001',
      barcode: '1234567890140',
      description: 'Drum unit for Brother HL-L2300 series printers, maintains print quality over time',
      categoryId: categories[5].id,
      manufacturer: 'Brother',
      model: 'DR-660',
      price: 79.99,
      minimumStock: 8
    },
    {
      name: 'Epson 101 Drum Unit',
      sku: 'DRUM-EPS-101-001',
      barcode: '1234567890151',
      description: 'Drum unit for Epson laser printers, ensures consistent print quality',
      categoryId: categories[5].id,
      manufacturer: 'Epson',
      model: '101',
      price: 129.99,
      minimumStock: 4
    },
    {
      name: 'HP 49A Imaging Drum Unit',
      sku: 'DRUM-HP-49A-001',
      barcode: '1234567890152',
      description: 'Imaging drum unit for HP LaserJet Pro printers, high-capacity drum for extended use',
      categoryId: categories[5].id,
      manufacturer: 'HP',
      model: '49A',
      price: 179.99,
      minimumStock: 3
    }
  ]

  // Create products
  const createdProducts = await Promise.all(
    products.map(product => prisma.product.create({ data: product }))
  )

  // Create serial numbers for some products (computers and printers)
  const serialNumbers = []
  
  // Add serial numbers for printers (first 5 products)
  for (let i = 0; i < 5; i++) {
    serialNumbers.push({
      serial: `PRT-${Date.now()}-${i + 1}`,
      productId: createdProducts[i].id,
      locationId: warehouse.id,
      status: 'IN_STOCK'
    })
  }

  // Add serial numbers for desktops (next 5 products)
  for (let i = 5; i < 10; i++) {
    serialNumbers.push({
      serial: `DESK-${Date.now()}-${i + 1}`,
      productId: createdProducts[i].id,
      locationId: serverRoom.id,
      status: 'IN_STOCK'
    })
  }

  // Add serial numbers for laptops (next 5 products)
  for (let i = 10; i < 15; i++) {
    serialNumbers.push({
      serial: `LAP-${Date.now()}-${i + 1}`,
      productId: createdProducts[i].id,
      locationId: officeStorage.id,
      status: 'IN_STOCK'
    })
  }

  // Create serial numbers
  await Promise.all(
    serialNumbers.map(sn =>
      prisma.serialNumber.create({
        data: {
          serial: sn.serial,
          productId: sn.productId,
          locationId: sn.locationId,
          status: sn.status as any, // Cast to any to satisfy Prisma enum type
        }
      })
    )
  )

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // Create staff user
  const staffPassword = await bcrypt.hash('staff123', 10)
  const staff = await prisma.user.create({
    data: {
      name: 'Staff User',
      email: 'staff@example.com',
      password: staffPassword,
      role: 'STAFF',
    },
  })
  console.log(`Created staff user: ${staff.email}`)

  console.log('Database seeded successfully!')
  console.log(`Created ${categories.length} categories`)
  console.log(`Created ${createdProducts.length} products`)
  console.log(`Created ${serialNumbers.length} serial numbers`)
  console.log(`Created ${2} users`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 