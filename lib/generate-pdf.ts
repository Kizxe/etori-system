import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { Product } from './types'

interface SerialNumber {
  id: string
  serial: string
  status: string
  notes?: string | null
  StorageLocation?: {
    id: string
    name: string
    description?: string | null
  } | null
}

interface SerialNumberWithProduct extends SerialNumber {
  productName: string
  productSku: string
  productId: string
}

export function generateInventoryPDF(products: Product[], customTitle?: string) {
  // Create new PDF document
  const doc = new jsPDF()

  // Add header
  doc.setFontSize(20)
  doc.text(customTitle || 'Inventory Report', 14, 20)
  
  // Add report metadata
  doc.setFontSize(10)
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30)
  doc.text(`Total Products: ${products.length}`, 14, 35)

  // Calculate total stock value
  const totalStock = products.reduce((sum, product) => 
    sum + (product.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0), 0
  )
  doc.text(`Total Stock: ${totalStock} units`, 14, 40)

  // Prepare table data
  const tableData = products.map(product => {
    const totalStock = product.SerialNumber?.filter(sn => sn.status === 'IN_STOCK').length || 0
    const status = totalStock === 0 ? 'Out of Stock' : 
                  totalStock <= product.minimumStock ? 'Low Stock' : 'In Stock'
    
    return [
      product.name,
      product.sku,
      product.category.name,
      product.manufacturer || '-',
      product.model || '-',
      totalStock.toString(),
      product.minimumStock.toString(),
      status
    ]
  })

  // Add table
  autoTable(doc, {
    head: [[
      'Product Name',
      'SKU',
      'Category',
      'Manufacturer',
      'Model',
      'Current Stock',
      'Min Stock',
      'Status'
    ]],
    body: tableData,
    startY: 50,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    // Highlight low stock and out of stock items
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 7) {
        const status = data.cell.text[0]
        if (status === 'Out of Stock') {
          data.cell.styles.textColor = [192, 57, 43] // Red
          data.cell.styles.fontStyle = 'bold'
        } else if (status === 'Low Stock') {
          data.cell.styles.textColor = [230, 126, 34] // Orange
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  const filename = customTitle 
    ? `${customTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    : `inventory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(filename)
}

export function generateSerialNumbersPDF(serialNumbers: SerialNumberWithProduct[], customTitle?: string) {
  // Create new PDF document
  const doc = new jsPDF()

  // Add header
  doc.setFontSize(20)
  doc.text(customTitle || 'Serial Numbers Report', 14, 20)
  
  // Add report metadata
  doc.setFontSize(10)
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30)
  doc.text(`Total Serial Numbers: ${serialNumbers.length}`, 14, 35)

  // Calculate status counts
  const inStockCount = serialNumbers.filter(sn => sn.status === 'IN_STOCK').length
  const outOfStockCount = serialNumbers.filter(sn => sn.status === 'OUT_OF_STOCK').length
  
  doc.text(`In Stock: ${inStockCount}`, 14, 40)
  doc.text(`Out of Stock: ${outOfStockCount}`, 14, 45)

  // Get unique products count
  const uniqueProducts = new Set(serialNumbers.map(sn => sn.productId)).size
  doc.text(`Products with Serial Numbers: ${uniqueProducts}`, 14, 50)

  // Prepare table data
  const tableData = serialNumbers.map(serialNumber => [
    serialNumber.productName,
    serialNumber.productSku,
    serialNumber.serial,
    serialNumber.status.replace('_', ' '),
    serialNumber.StorageLocation?.name || 'No location',
    serialNumber.notes || '-'
  ])

  // Add main serial numbers table
  autoTable(doc, {
    head: [[
      'Product Name',
      'SKU',
      'Serial Number',
      'Status',
      'Location',
      'Notes'
    ]],
    body: tableData,
    startY: 60,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    // Highlight status colors
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.text[0]
        if (status === 'OUT OF STOCK') {
          data.cell.styles.textColor = [192, 57, 43] // Red
          data.cell.styles.fontStyle = 'bold'
        } else if (status === 'IN STOCK') {
          data.cell.styles.textColor = [39, 174, 96] // Green
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // Add product summary table
  const productSummary = Array.from(
    serialNumbers.reduce((acc, sn) => {
      if (!acc.has(sn.productId)) {
        acc.set(sn.productId, {
          productName: sn.productName,
          productSku: sn.productSku,
          total: 0,
          inStock: 0,
          outOfStock: 0
        })
      }
      const product = acc.get(sn.productId)!
      product.total++
      if (sn.status === 'IN_STOCK') {
        product.inStock++
      } else {
        product.outOfStock++
      }
      return acc
    }, new Map())
  ).map(([_, data]) => data)

  // Add new page for product summary if needed
  const finalY = (doc as any).lastAutoTable.finalY || 60
  if (finalY > 250) {
    doc.addPage()
  }

  autoTable(doc, {
    head: [[
      'Product Name',
      'SKU',
      'Total Serial Numbers',
      'In Stock',
      'Out of Stock'
    ]],
    body: productSummary.map(product => [
      product.productName,
      product.productSku,
      product.total.toString(),
      product.inStock.toString(),
      product.outOfStock.toString()
    ]),
    startY: finalY > 250 ? 20 : finalY + 20,
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    headStyles: {
      fillColor: [52, 73, 94],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    // Add title for this table
    didDrawPage: (data) => {
      if (data.pageNumber === 1 && finalY <= 250) {
        doc.setFontSize(12)
        doc.text('Product Summary', 14, finalY + 10)
      } else if (data.pageNumber === 2) {
        doc.setFontSize(12)
        doc.text('Product Summary', 14, 15)
      }
    }
  })

  // Add footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  // Save the PDF
  const filename = customTitle 
    ? `${customTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    : `serial-numbers-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(filename)
} 

// Inventory Aging PDF
interface SerialNumberForAgingReport extends SerialNumberWithProduct {
  agingStatus: string
  inventoryDate: string | Date
  daysInInventory: number
  needsAttention?: boolean
}

export function generateInventoryAgingPDF(serialNumbers: SerialNumberForAgingReport[], customTitle?: string) {
  const doc = new jsPDF()

  // Header
  doc.setFontSize(20)
  doc.text(customTitle || 'Inventory Aging Report', 14, 20)

  // Metadata
  doc.setFontSize(10)
  doc.text(`Generated on: ${format(new Date(), 'PPP')}`, 14, 30)
  doc.text(`Total Items: ${serialNumbers.length}`, 14, 35)

  const counts = serialNumbers.reduce(
    (acc, sn) => {
      const status = (sn.agingStatus || '').toUpperCase()
      if (status === 'FRESH') acc.fresh++
      else if (status === 'AGING') acc.aging++
      else if (status === 'STALE') acc.stale++
      else if (status === 'DEAD_STOCK') acc.dead++
      if (sn.needsAttention) acc.attention++
      return acc
    },
    { fresh: 0, aging: 0, stale: 0, dead: 0, attention: 0 }
  )

  doc.text(`Fresh: ${counts.fresh}  •  Aging: ${counts.aging}  •  Stale: ${counts.stale}  •  Dead Stock: ${counts.dead}`, 14, 40)
  doc.text(`Needs Attention: ${counts.attention}`, 14, 45)

  // Table
  const tableData = serialNumbers.map((sn) => [
    sn.serial,
    sn.productName,
    sn.productSku,
    sn.status.replace('_', ' '),
    (sn.agingStatus || '').replace('_', ' '),
    String(sn.daysInInventory),
    typeof sn.inventoryDate === 'string' ? sn.inventoryDate : format(sn.inventoryDate, 'PPP'),
    sn.StorageLocation?.name || 'No location',
    sn.needsAttention ? 'Yes' : 'No'
  ])

  autoTable(doc, {
    head: [[
      'Serial Number',
      'Product',
      'SKU',
      'Status',
      'Aging',
      'Days',
      'Inventory Date',
      'Location',
      'Needs Attention'
    ]],
    body: tableData,
    startY: 55,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    didDrawCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const aging = data.cell.text[0]
        if (aging === 'ACTIVE') {
          data.cell.styles.textColor = [39, 174, 96]
        } else if (aging === 'IDLE') {
          data.cell.styles.textColor = [241, 196, 15]
        } else if (aging === 'OBSOLETE') {
          data.cell.styles.textColor = [230, 126, 34]
          data.cell.styles.fontStyle = 'bold'
        } else if (aging === 'SURPLUS') {
          data.cell.styles.textColor = [192, 57, 43]
          data.cell.styles.fontStyle = 'bold'
        }
      }
      if (data.section === 'body' && data.column.index === 8) {
        const attn = data.cell.text[0]
        if (attn === 'Yes') {
          data.cell.styles.textColor = [192, 57, 43]
          data.cell.styles.fontStyle = 'bold'
        }
      }
    },
  })

  // Footer
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.width / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    )
  }

  const filename = customTitle
    ? `${customTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
    : `inventory-aging-${format(new Date(), 'yyyy-MM-dd')}.pdf`
  doc.save(filename)
}