# Serial Numbers System Guide

## Overview

Sistem inventory ini telah ditingkatkan dengan ciri **Serial Numbers** yang membolehkan anda mengesan setiap barangan individu dengan nombor siri yang unik. Ini adalah penting untuk:

- **Tracking individu** - Setiap barangan mempunyai nombor siri yang unik
- **Inventory management** - Menguruskan stok pada tahap item individu
- **Audit trail** - Mencari dan mengesan barangan tertentu
- **Quality control** - Mengesan barangan yang rosak atau hilang

## Konsep Asas

### Product vs Serial Number
- **Product**: Maklumat umum tentang jenis barangan (nama, SKU, barcode, harga, dll)
- **Serial Number**: Item individu dengan nombor siri yang unik

### Contoh
```
Product: "iPhone 15 Pro" (SKU: IPH15P-001, Barcode: 1234567890123)
├── Serial Number: SN-IPH15P-001-001 (Item #1)
├── Serial Number: SN-IPH15P-001-002 (Item #2)
├── Serial Number: SN-IPH15P-001-003 (Item #3)
└── Serial Number: SN-IPH15P-001-004 (Item #4)
```

## Status Serial Numbers

Setiap serial number mempunyai status yang menunjukkan kedudukan semasa:

- **IN_STOCK** 🟢 - Dalam stok, tersedia untuk digunakan
- **OUT_OF_STOCK** 🔴 - Tidak dalam stok, mungkin dipinjam/digunakan
- **RESERVED** 🔵 - Direservasi untuk kegunaan tertentu
- **IN_TRANSIT** 🟡 - Dalam perjalanan (dihantar/dipindah)
- **DAMAGED** ⚠️ - Rosak, tidak boleh digunakan
- **LOST** ⚫ - Hilang, perlu dicari

## Cara Menggunakan

### 1. Menambah Product dengan Serial Numbers

Apabila menambah product baru:

1. Buka **Products** page
2. Klik **Add Product**
3. Isi maklumat product
4. Masukkan **Initial Stock** (bilangan serial numbers yang akan dibuat)
5. Klik **Add Product**

Sistem akan secara automatik:
- Membuat product
- Membuat storage location "Main Storage" jika belum wujud
- Membuat serial numbers mengikut jumlah initial stock
- Format: `SN-{SKU}-{timestamp}-{sequence}`

### 2. Menguruskan Serial Numbers Sedia Ada

Untuk product yang sudah wujud:

1. Buka **Products** page
2. Cari product yang dikehendaki
3. Klik **Actions** → **Manage Serial Numbers**
4. Dalam dialog yang terbuka, anda boleh:
   - **Add Serial Number**: Tambah satu serial number
   - **Bulk Add Serial Numbers**: Tambah banyak serial numbers sekaligus
   - **Edit**: Ubah status, location, atau notes
   - **Delete**: Hapus serial number

### 3. Bulk Add Serial Numbers

Untuk menambah banyak serial numbers sekaligus:

1. Buka **Manage Serial Numbers** dialog
2. Klik **Bulk Add Serial Numbers**
3. Masukkan:
   - **Quantity**: Bilangan serial numbers
   - **Start Number**: Nombor mula (default: 1)
   - **Prefix**: Awalan untuk serial number (default: SN-{SKU})
   - **Status**: Status default
   - **Location**: Storage location
4. Klik **Add {Quantity} Serial Numbers**

Format yang dihasilkan: `{Prefix}-{StartNumber}`, `{Prefix}-{StartNumber+1}`, dll.

### 4. Menguruskan Storage Locations

Untuk menguruskan lokasi penyimpanan:

1. Buka **Settings** page
2. Pilih tab **Inventory**
3. Dalam **Storage Locations** section, klik **Storage Locations**
4. Anda boleh:
   - **Add Location**: Tambah lokasi baru
   - **Edit**: Ubah nama atau description
   - **Delete**: Hapus lokasi (hanya jika tiada serial numbers)

## Dashboard Overview

Dashboard menunjukkan:

- **Total Stock**: Jumlah serial numbers dengan status "IN_STOCK"
- **Serial Numbers Overview**: 
  - Ringkasan mengikut status
  - Senarai serial numbers terkini
  - Filter mengikut status

## API Endpoints

### Serial Numbers
- `GET /api/products/serial-numbers` - Dapatkan semua serial numbers
- `POST /api/products/serial-numbers` - Tambah serial number baru
- `PUT /api/products/serial-numbers/[id]` - Update serial number
- `DELETE /api/products/serial-numbers/[id]` - Hapus serial number

### Bulk Serial Numbers
- `POST /api/products/bulk-serial-numbers` - Tambah banyak serial numbers

### Storage Locations
- `GET /api/storage` - Dapatkan semua storage locations
- `POST /api/storage` - Tambah storage location baru
- `PUT /api/storage/[id]` - Update storage location
- `DELETE /api/storage/[id]` - Hapus storage location

## Best Practices

### 1. Naming Convention
- Gunakan format yang konsisten untuk serial numbers
- Contoh: `SN-{SKU}-{YEAR}-{SEQUENCE}` atau `SN-{SKU}-{LOCATION}-{SEQUENCE}`

### 2. Status Management
- Sentiasa update status serial numbers apabila ada perubahan
- Gunakan status yang sesuai untuk tracking yang tepat

### 3. Location Organization
- Buat storage locations yang logik dan mudah difahami
- Contoh: "Warehouse A", "Shelf B1", "Office Storage", "Shipping Area"

### 4. Regular Audits
- Jalankan audit berkala untuk memastikan status serial numbers adalah tepat
- Update status yang tidak tepat

## Troubleshooting

### Serial Number Already Exists
- Pastikan setiap serial number adalah unik
- Gunakan prefix yang berbeza atau tambah timestamp

### Cannot Delete Storage Location
- Pastikan tiada serial numbers yang menggunakan location tersebut
- Pindah atau hapus serial numbers terlebih dahulu

### Performance Issues
- Untuk inventory yang besar, gunakan pagination
- Index database fields yang kerap digunakan

## Migration dari Sistem Lama

Jika anda sudah ada data dalam sistem:

1. **Backup** database terlebih dahulu
2. **Run migration** untuk menambah table SerialNumber
3. **Import data** sedia ada ke dalam struktur baru
4. **Verify** data telah dipindah dengan betul

## Support

Untuk sebarang pertanyaan atau masalah:

1. Semak **Console** browser untuk error messages
2. Periksa **Network** tab untuk API calls yang gagal
3. Rujuk **Database logs** untuk error database
4. Hubungi **Development team** jika masalah berterusan

---

**Nota**: Sistem ini direka untuk inventory yang memerlukan tracking pada tahap item individu. Untuk inventory yang hanya memerlukan tracking kuantiti, anda boleh terus menggunakan sistem sedia ada.
