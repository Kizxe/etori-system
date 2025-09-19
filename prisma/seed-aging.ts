import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// Helper function to create dates in the past
function getDateDaysAgo(days: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date
}

async function main() {
  console.log('🌱 Starting inventory aging seed...')

  // Clear existing data
  await prisma.stockRequest.deleteMany({})
  await prisma.notification.deleteMany({})
  await prisma.serialNumber.deleteMany({})
  await prisma.product.deleteMany({})
  await prisma.category.deleteMany({})
  await prisma.storageLocation.deleteMany({})
  await prisma.user.deleteMany({})

  // Create storage locations
  const locations = await Promise.all([
    prisma.storageLocation.create({
      data: {
        name: 'Main Warehouse',
        description: 'Primary storage facility for all inventory'
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Office Storage',
        description: 'Storage area within the office building'
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Server Room',
        description: 'Secure storage for high-value IT equipment'
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Cold Storage',
        description: 'Temperature-controlled storage for sensitive equipment'
      }
    }),
    prisma.storageLocation.create({
      data: {
        name: 'Returns Area',
        description: 'Area for returned and refurbished items'
      }
    })
  ])

  // Create categories
  const categories = await Promise.all([
    prisma.category.create({ data: { name: 'Printers' } }),
    prisma.category.create({ data: { name: 'Desktops' } }),
    prisma.category.create({ data: { name: 'Laptops' } }),
    prisma.category.create({ data: { name: 'Toner' } }),
    prisma.category.create({ data: { name: 'Ink' } }),
    prisma.category.create({ data: { name: 'Drums' } }),
    prisma.category.create({ data: { name: 'Monitors' } }),
    prisma.category.create({ data: { name: 'Networking' } }),
    prisma.category.create({ data: { name: 'Accessories' } })
  ])

  // Create products with realistic IT equipment
  const products = [
    // Printers - High value items that age quickly
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

    // Desktops - Medium aging items
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
      name: 'Apple iMac 24" M1',
      sku: 'DESK-APP-IMAC24M1-001',
      barcode: '1234567890128',
      description: 'All-in-one desktop with Apple M1 chip, 8GB RAM, 256GB SSD',
      categoryId: categories[1].id,
      manufacturer: 'Apple',
      model: 'iMac 24" M1',
      price: 1299.99,
      minimumStock: 1
    },

    // Laptops - Fast moving items
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
      name: 'Apple MacBook Pro 13" M2',
      sku: 'LAP-APP-MBP13M2-001',
      barcode: '1234567890131',
      description: 'Professional laptop with Apple M2 chip, 8GB RAM, 256GB SSD',
      categoryId: categories[2].id,
      manufacturer: 'Apple',
      model: 'MacBook Pro 13" M2',
      price: 1499.99,
      minimumStock: 1
    },

    // Monitors - Slow aging items
    {
      name: 'Dell UltraSharp U2720Q',
      sku: 'MON-DELL-U2720Q-001',
      barcode: '1234567890132',
      description: '27" 4K UHD monitor with USB-C connectivity',
      categoryId: categories[6].id,
      manufacturer: 'Dell',
      model: 'UltraSharp U2720Q',
      price: 599.99,
      minimumStock: 3
    },
    {
      name: 'HP EliteDisplay E243d',
      sku: 'MON-HP-E243D-001',
      barcode: '1234567890133',
      description: '24" Full HD monitor with docking station',
      categoryId: categories[6].id,
      manufacturer: 'HP',
      model: 'EliteDisplay E243d',
      price: 399.99,
      minimumStock: 5
    },

    // Networking equipment - Medium aging
    {
      name: 'Cisco Catalyst 2960 Switch',
      sku: 'NET-CIS-2960-001',
      barcode: '1234567890134',
      description: '24-port managed switch for enterprise networks',
      categoryId: categories[7].id,
      manufacturer: 'Cisco',
      model: 'Catalyst 2960',
      price: 799.99,
      minimumStock: 2
    },
    {
      name: 'Netgear ProSAFE GS108T',
      sku: 'NET-NET-GS108T-001',
      barcode: '1234567890135',
      description: '8-port smart managed switch',
      categoryId: categories[7].id,
      manufacturer: 'Netgear',
      model: 'ProSAFE GS108T',
      price: 149.99,
      minimumStock: 4
    },

    // Toner - Fast moving consumables
    {
      name: 'HP 26A Black Toner Cartridge',
      sku: 'TON-HP-26A-001',
      barcode: '1234567890136',
      description: 'High-yield black toner cartridge for HP LaserJet printers',
      categoryId: categories[3].id,
      manufacturer: 'HP',
      model: '26A',
      price: 89.99,
      minimumStock: 10
    },
    {
      name: 'Canon 052 Black Toner',
      sku: 'TON-CAN-052-001',
      barcode: '1234567890137',
      description: 'Black toner cartridge for Canon imageRUNNER printers',
      categoryId: categories[3].id,
      manufacturer: 'Canon',
      model: '052',
      price: 129.99,
      minimumStock: 8
    },

    // Ink - Very fast moving
    {
      name: 'HP 65 Black Ink Cartridge',
      sku: 'INK-HP-65-001',
      barcode: '1234567890138',
      description: 'Black ink cartridge for HP DeskJet and ENVY printers',
      categoryId: categories[4].id,
      manufacturer: 'HP',
      model: '65',
      price: 24.99,
      minimumStock: 25
    },
    {
      name: 'Canon PG-245 Black Ink',
      sku: 'INK-CAN-PG245-001',
      barcode: '1234567890139',
      description: 'Black ink cartridge for Canon PIXMA printers',
      categoryId: categories[4].id,
      manufacturer: 'Canon',
      model: 'PG-245',
      price: 19.99,
      minimumStock: 30
    },

    // Drums - Slow moving but high value
    {
      name: 'HP 26A Imaging Drum Unit',
      sku: 'DRUM-HP-26A-001',
      barcode: '1234567890140',
      description: 'Imaging drum unit for HP LaserJet printers',
      categoryId: categories[5].id,
      manufacturer: 'HP',
      model: '26A',
      price: 149.99,
      minimumStock: 5
    },

    // Accessories - Mixed aging patterns
    {
      name: 'Logitech MX Master 3 Mouse',
      sku: 'ACC-LOG-MX3-001',
      barcode: '1234567890141',
      description: 'Wireless ergonomic mouse with precision tracking',
      categoryId: categories[8].id,
      manufacturer: 'Logitech',
      model: 'MX Master 3',
      price: 99.99,
      minimumStock: 8
    },
    {
      name: 'Microsoft Surface Keyboard',
      sku: 'ACC-MIC-SURF-KB-001',
      barcode: '1234567890142',
      description: 'Wireless keyboard with backlit keys',
      categoryId: categories[8].id,
      manufacturer: 'Microsoft',
      model: 'Surface Keyboard',
      price: 129.99,
      minimumStock: 6
    }
  ]

  // Create products
  const createdProducts = await Promise.all(
    products.map(product => prisma.product.create({ data: product }))
  )

  console.log(`✅ Created ${createdProducts.length} products`)

  // Create serial numbers with realistic aging patterns
  const serialNumbers = []

  // FRESH items (0-30 days) - Recent arrivals
  const freshItems = [
    { product: createdProducts[0], serial: 'PRT-HP-M404N-F001', daysAgo: 5, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[0], serial: 'PRT-HP-M404N-F002', daysAgo: 12, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[1], serial: 'PRT-CAN-TS8320-F001', daysAgo: 8, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[3], serial: 'DESK-DELL-7090-F001', daysAgo: 15, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[6], serial: 'LAP-DELL-5520-F001', daysAgo: 3, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[6], serial: 'LAP-DELL-5520-F002', daysAgo: 18, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[9], serial: 'MON-DELL-U2720Q-F001', daysAgo: 25, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[12], serial: 'TON-HP-26A-F001', daysAgo: 7, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[12], serial: 'TON-HP-26A-F002', daysAgo: 20, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[14], serial: 'INK-HP-65-F001', daysAgo: 2, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[14], serial: 'INK-HP-65-F002', daysAgo: 28, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[16], serial: 'ACC-LOG-MX3-F001', daysAgo: 10, location: locations[1], status: 'IN_STOCK' }
  ]

  // AGING items (31-44 days) - Getting close to stale
  const agingItems = [
    { product: createdProducts[1], serial: 'PRT-CAN-TS8320-A001', daysAgo: 35, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[2], serial: 'PRT-BRO-HL2350DW-A001', daysAgo: 38, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[4], serial: 'DESK-HP-800G5-A001', daysAgo: 42, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[7], serial: 'LAP-HP-840G8-A001', daysAgo: 33, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[8], serial: 'LAP-APP-MBP13M2-A001', daysAgo: 40, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[10], serial: 'MON-HP-E243D-A001', daysAgo: 36, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[11], serial: 'NET-CIS-2960-A001', daysAgo: 44, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[13], serial: 'TON-CAN-052-A001', daysAgo: 31, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[15], serial: 'INK-CAN-PG245-A001', daysAgo: 39, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[17], serial: 'ACC-MIC-SURF-KB-A001', daysAgo: 37, location: locations[1], status: 'IN_STOCK' }
  ]

  // STALE items (45-89 days) - Need attention
  const staleItems = [
    { product: createdProducts[0], serial: 'PRT-HP-M404N-S001', daysAgo: 52, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[0], serial: 'PRT-HP-M404N-S002', daysAgo: 67, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[2], serial: 'PRT-BRO-HL2350DW-S001', daysAgo: 58, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[3], serial: 'DESK-DELL-7090-S001', daysAgo: 73, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[5], serial: 'DESK-APP-IMAC24M1-S001', daysAgo: 61, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[6], serial: 'LAP-DELL-5520-S001', daysAgo: 49, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[7], serial: 'LAP-HP-840G8-S001', daysAgo: 76, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[9], serial: 'MON-DELL-U2720Q-S001', daysAgo: 55, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[10], serial: 'MON-HP-E243D-S001', daysAgo: 68, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[11], serial: 'NET-CIS-2960-S001', daysAgo: 82, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[12], serial: 'NET-NET-GS108T-S001', daysAgo: 47, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[13], serial: 'TON-HP-26A-S001', daysAgo: 63, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[14], serial: 'TON-CAN-052-S001', daysAgo: 71, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[15], serial: 'INK-HP-65-S001', daysAgo: 54, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[16], serial: 'INK-CAN-PG245-S001', daysAgo: 79, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[17], serial: 'DRUM-HP-26A-S001', daysAgo: 66, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[18], serial: 'ACC-LOG-MX3-S001', daysAgo: 48, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[19], serial: 'ACC-MIC-SURF-KB-S001', daysAgo: 74, location: locations[1], status: 'IN_STOCK' }
  ]

  // DEAD STOCK items (90+ days) - Critical attention needed
  const deadStockItems = [
    { product: createdProducts[0], serial: 'PRT-HP-M404N-D001', daysAgo: 95, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[0], serial: 'PRT-HP-M404N-D002', daysAgo: 120, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[1], serial: 'PRT-CAN-TS8320-D001', daysAgo: 105, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[2], serial: 'PRT-BRO-HL2350DW-D001', daysAgo: 135, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[3], serial: 'DESK-DELL-7090-D001', daysAgo: 98, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[4], serial: 'DESK-HP-800G5-D001', daysAgo: 112, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[5], serial: 'DESK-APP-IMAC24M1-D001', daysAgo: 145, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[6], serial: 'LAP-DELL-5520-D001', daysAgo: 92, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[7], serial: 'LAP-HP-840G8-D001', daysAgo: 108, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[8], serial: 'LAP-APP-MBP13M2-D001', daysAgo: 125, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[9], serial: 'MON-DELL-U2720Q-D001', daysAgo: 101, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[10], serial: 'MON-HP-E243D-D001', daysAgo: 118, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[11], serial: 'NET-CIS-2960-D001', daysAgo: 142, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[12], serial: 'NET-NET-GS108T-D001', daysAgo: 96, location: locations[2], status: 'IN_STOCK' },
    { product: createdProducts[13], serial: 'TON-HP-26A-D001', daysAgo: 110, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[14], serial: 'TON-CAN-052-D001', daysAgo: 128, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[15], serial: 'INK-HP-65-D001', daysAgo: 94, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[16], serial: 'INK-CAN-PG245-D001', daysAgo: 115, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[17], serial: 'DRUM-HP-26A-D001', daysAgo: 103, location: locations[0], status: 'IN_STOCK' },
    { product: createdProducts[18], serial: 'ACC-LOG-MX3-D001', daysAgo: 97, location: locations[1], status: 'IN_STOCK' },
    { product: createdProducts[19], serial: 'ACC-MIC-SURF-KB-D001', daysAgo: 122, location: locations[1], status: 'IN_STOCK' }
  ]

  // Add some items with different statuses
  const otherStatusItems = [
    { product: createdProducts[6], serial: 'LAP-DELL-5520-R001', daysAgo: 15, location: locations[1], status: 'RESERVED' },
    { product: createdProducts[7], serial: 'LAP-HP-840G8-T001', daysAgo: 8, location: locations[1], status: 'IN_TRANSIT' },
    { product: createdProducts[3], serial: 'DESK-DELL-7090-O001', daysAgo: 25, location: locations[2], status: 'OUT_OF_STOCK' },
    { product: createdProducts[0], serial: 'PRT-HP-M404N-DM001', daysAgo: 45, location: locations[4], status: 'DAMAGED' },
    { product: createdProducts[1], serial: 'PRT-CAN-TS8320-L001', daysAgo: 30, location: locations[4], status: 'LOST' }
  ]

  // Combine all items
  const allItems = [
    ...freshItems.map(item => ({ ...item, agingStatus: 'FRESH' as const })),
    ...agingItems.map(item => ({ ...item, agingStatus: 'AGING' as const })),
    ...staleItems.map(item => ({ ...item, agingStatus: 'STALE' as const })),
    ...deadStockItems.map(item => ({ ...item, agingStatus: 'DEAD_STOCK' as const })),
    ...otherStatusItems.map(item => ({ ...item, agingStatus: 'FRESH' as const }))
  ]

  // Create serial numbers with realistic inventory dates
  for (const item of allItems) {
    const inventoryDate = getDateDaysAgo(item.daysAgo)
    const needsAttention = item.agingStatus === 'STALE' || item.agingStatus === 'DEAD_STOCK'
    
    serialNumbers.push({
      serial: item.serial,
      productId: item.product.id,
      locationId: item.location.id,
      status: item.status as any,
      inventoryDate,
      agingStatus: item.agingStatus,
      needsAttention,
      lastAlertSent: needsAttention ? getDateDaysAgo(Math.floor(Math.random() * 7)) : null
    })
  }

  // Create serial numbers in database
  await Promise.all(
    serialNumbers.map(sn =>
      prisma.serialNumber.create({
        data: {
          serial: sn.serial,
          productId: sn.productId,
          locationId: sn.locationId,
          status: sn.status,
          inventoryDate: sn.inventoryDate,
          agingStatus: sn.agingStatus,
          needsAttention: sn.needsAttention,
          lastAlertSent: sn.lastAlertSent
        }
      })
    )
  )

  console.log(`✅ Created ${serialNumbers.length} serial numbers with aging data`)

  // Create users
  const adminPassword = await bcrypt.hash('admin123', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@example.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  const staffPassword = await bcrypt.hash('staff123', 10)
  const staff = await prisma.user.create({
    data: {
      name: 'Staff User',
      email: 'staff@example.com',
      password: staffPassword,
      role: 'STAFF',
    },
  })

  console.log(`✅ Created admin user: ${admin.email}`)
  console.log(`✅ Created staff user: ${staff.email}`)

  // Create some stock requests for realistic data
  const stockRequests = [
    {
      productId: createdProducts[6].id, // Dell Latitude 5520
      userId: staff.id,
      quantity: 1,
      status: 'PENDING' as const,
      notes: 'Need laptop for new employee onboarding'
    },
    {
      productId: createdProducts[0].id, // HP LaserJet Pro M404n
      userId: staff.id,
      quantity: 1,
      status: 'APPROVED' as const,
      notes: 'Office printer replacement'
    },
    {
      productId: createdProducts[12].id, // HP 26A Toner
      userId: staff.id,
      quantity: 5,
      status: 'COMPLETED' as const,
      notes: 'Restock toner cartridges'
    }
  ]

  await Promise.all(
    stockRequests.map(request =>
      prisma.stockRequest.create({
        data: {
          productId: request.productId,
          userId: request.userId,
          quantity: request.quantity,
          status: request.status,
          notes: request.notes
        }
      })
    )
  )

  console.log(`✅ Created ${stockRequests.length} stock requests`)

  // Print summary statistics
  const agingStats = {
    fresh: freshItems.length,
    aging: agingItems.length,
    stale: staleItems.length,
    deadStock: deadStockItems.length,
    other: otherStatusItems.length
  }

  console.log('\n📊 Inventory Aging Summary:')
  console.log(`   Fresh (0-30 days): ${agingStats.fresh} items`)
  console.log(`   Aging (31-44 days): ${agingStats.aging} items`)
  console.log(`   Stale (45-89 days): ${agingStats.stale} items`)
  console.log(`   Dead Stock (90+ days): ${agingStats.deadStock} items`)
  console.log(`   Other Status: ${agingStats.other} items`)
  console.log(`   Total Items: ${serialNumbers.length}`)

  console.log('\n🎉 Inventory aging seed completed successfully!')
  console.log('\n📝 Login credentials:')
  console.log('   Admin: admin@example.com / admin123')
  console.log('   Staff: staff@example.com / staff123')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
