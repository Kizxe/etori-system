import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'

interface Product {
  name: string
  sku: string
  category: {
    name: string
  }
  manufacturer: string | null
  model: string | null
  minimumStock: number
  SerialNumber?: {
    status: string
  }[]
}

export function generateInventoryPDF(products: Product[]) {
  // Create new PDF document
  const doc = new jsPDF()

  // Add header
  doc.setFontSize(20)
  doc.text('Inventory Report', 14, 20)
  
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
  doc.save(`inventory-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`)
} 