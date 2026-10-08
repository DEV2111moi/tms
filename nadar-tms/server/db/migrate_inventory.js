const { query } = require('./pool');

async function migrate() {
  console.log('Starting inventory & maintenance migration...');

  // 1. Create inventory_items table
  await query(`
    CREATE TABLE IF NOT EXISTS inventory_items (
      id INT(11) NOT NULL AUTO_INCREMENT,
      part_name VARCHAR(120) NOT NULL,
      part_number VARCHAR(60) DEFAULT NULL,
      category VARCHAR(60) DEFAULT 'General Spares',
      unit VARCHAR(20) DEFAULT 'pcs',
      unit_cost DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      quantity DECIMAL(10,2) NOT NULL DEFAULT 0.00,
      min_stock_alert DECIMAL(10,2) DEFAULT 5.00,
      supplier_name VARCHAR(120) DEFAULT NULL,
      invoice_no VARCHAR(80) DEFAULT NULL,
      purchase_date DATE DEFAULT NULL,
      notes TEXT DEFAULT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ inventory_items table created/verified.');

  // 2. Add columns to maintenance_logs if they don't exist
  const existingCols = await query('DESCRIBE maintenance_logs');
  const colNames = existingCols.map(c => c.Field);

  if (!colNames.includes('bill_no')) {
    await query('ALTER TABLE maintenance_logs ADD COLUMN bill_no VARCHAR(50) DEFAULT NULL');
    console.log('✓ Added bill_no to maintenance_logs');
  }
  if (!colNames.includes('workshop_name')) {
    await query('ALTER TABLE maintenance_logs ADD COLUMN workshop_name VARCHAR(120) DEFAULT NULL');
    console.log('✓ Added workshop_name to maintenance_logs');
  }
  if (!colNames.includes('mechanic_name')) {
    await query('ALTER TABLE maintenance_logs ADD COLUMN mechanic_name VARCHAR(100) DEFAULT NULL');
    console.log('✓ Added mechanic_name to maintenance_logs');
  }
  if (!colNames.includes('labor_charges')) {
    await query('ALTER TABLE maintenance_logs ADD COLUMN labor_charges DECIMAL(10,2) DEFAULT 0.00');
    console.log('✓ Added labor_charges to maintenance_logs');
  }
  if (!colNames.includes('parts_cost')) {
    await query('ALTER TABLE maintenance_logs ADD COLUMN parts_cost DECIMAL(10,2) DEFAULT 0.00');
    console.log('✓ Added parts_cost to maintenance_logs');
  }
  if (!colNames.includes('parts_data')) {
    await query('ALTER TABLE maintenance_logs ADD COLUMN parts_data LONGTEXT DEFAULT NULL');
    console.log('✓ Added parts_data to maintenance_logs');
  }

  // 3. Seed some initial realistic spare parts if inventory is empty
  const [countResult] = await query('SELECT COUNT(*) as count FROM inventory_items');
  if (Number(countResult.count) === 0) {
    const sampleItems = [
      ['Wheel Hub Bolt (M16 x 1.5)', 'BLT-WH-16', 'Fasteners & Hardware', 'pcs', 75.00, 120.00, 20.00, 'Sri Murugan Auto Spares', 'INV-2026-101', '2026-09-01'],
      ['Axle Flange Bolt (High Tensile)', 'BLT-AX-12', 'Fasteners & Hardware', 'pcs', 45.00, 80.00, 15.00, 'Sri Murugan Auto Spares', 'INV-2026-101', '2026-09-01'],
      ['Brake Shoe Set (Front / Rear)', 'BRK-SH-01', 'Brakes', 'sets', 2850.00, 12.00, 4.00, 'TVS Brakes & Parts', 'TVS-9921', '2026-09-10'],
      ['Brake Liner Kit (Air Brake)', 'BRK-LNR-44', 'Brakes', 'sets', 1450.00, 18.00, 5.00, 'TVS Brakes & Parts', 'TVS-9921', '2026-09-10'],
      ['Engine Oil 15W40 (Castrol CRB Turbomax)', 'OIL-15W40', 'Oils & Lubricants', 'liters', 290.00, 250.00, 50.00, 'Central Petroleum Agency', 'CPA-7811', '2026-09-15'],
      ['Power Steering Oil (ATF Dexron II)', 'OIL-PS-01', 'Oils & Lubricants', 'liters', 380.00, 45.00, 10.00, 'Central Petroleum Agency', 'CPA-7811', '2026-09-15'],
      ['Gearbox Oil 80W90', 'OIL-GB-8090', 'Oils & Lubricants', 'liters', 320.00, 60.00, 15.00, 'Central Petroleum Agency', 'CPA-7811', '2026-09-15'],
      ['Diesel Fuel Filter (Spin-on)', 'FLT-DSL-02', 'Engine & Filters', 'pcs', 550.00, 30.00, 8.00, 'Bosch Auto Parts', 'BSH-4512', '2026-09-18'],
      ['Engine Oil Filter Cartridge', 'FLT-OIL-01', 'Engine & Filters', 'pcs', 480.00, 35.00, 8.00, 'Bosch Auto Parts', 'BSH-4512', '2026-09-18'],
      ['Air Filter Primary Element', 'FLT-AIR-PR', 'Engine & Filters', 'pcs', 1250.00, 15.00, 4.00, 'Fleetguard India', 'FG-3310', '2026-09-20'],
      ['Accelerator Return Spring', 'SPR-ACC-01', 'Springs & Controls', 'pcs', 95.00, 40.00, 10.00, 'Theni Spring Works', 'TSW-104', '2026-09-22'],
      ['Accelerator Linkage Ball Joint', 'BJ-ACC-10', 'Springs & Controls', 'pcs', 120.00, 35.00, 10.00, 'Theni Spring Works', 'TSW-104', '2026-09-22'],
      ['Clutch Pressure Plate & Disc', 'CLT-SET-01', 'Clutch & Gearbox', 'sets', 6800.00, 6.00, 2.00, 'Ceekay Clutches Ltd', 'CK-8820', '2026-09-25'],
      ['Coolant Liquid (Concentrate Green)', 'CLN-5L-GR', 'Oils & Lubricants', 'liters', 180.00, 80.00, 20.00, 'Central Petroleum Agency', 'CPA-7900', '2026-09-28'],
      ['Fan Alternator Belt (V-Belt)', 'BLT-FAN-88', 'Belts & Hoses', 'pcs', 420.00, 25.00, 6.00, 'Gates Belts India', 'GT-1192', '2026-10-01'],
      ['Headlamp 24V 70W Halogen Bulb', 'ELC-HL-24V', 'Electrical & Lighting', 'pcs', 160.00, 50.00, 12.00, 'Philips Automotive', 'PH-552', '2026-10-01'],
      ['Wiper Blade Heavy Duty (24 inch)', 'WPR-24HD', 'Body & Cabin', 'pcs', 350.00, 30.00, 8.00, 'Roots Auto Products', 'RT-901', '2026-10-02']
    ];

    for (const item of sampleItems) {
      await query(
        'INSERT INTO inventory_items (part_name, part_number, category, unit, unit_cost, quantity, min_stock_alert, supplier_name, invoice_no, purchase_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        item
      );
    }
    console.log(`✓ Seeded ${sampleItems.length} initial inventory spare parts.`);
  }

  console.log('✓ Migration completed successfully!');
  process.exit(0);
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  process.exit(1);
});
