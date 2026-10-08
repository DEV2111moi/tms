const { query } = require('../db/pool');

/**
 * Generate unique maintenance bill number (e.g. TMHNU-MN-20261005-0012)
 */
function generateBillNo() {
  const d = new Date();
  const ymd = d.toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TMHNU-MN-${ymd}-${rand}`;
}

/**
 * Save a new maintenance log with itemized spare parts billing and auto-deduct inventory stock
 */
exports.saveMaintenanceWithParts = async (req, res) => {
  try {
    const {
      bus_id,
      service_date,
      service_type,
      cost,
      odometer,
      next_due_date,
      notes,
      bill_no,
      workshop_name,
      mechanic_name,
      labor_charges,
      parts_cost,
      parts_data,
      driver_name,
      driver_id,
      job_card_no,
      mileage,
      lamp,
      serial_no
    } = req.body;

    const finalBillNo = bill_no || generateBillNo();
    const finalJobCardNo = job_card_no || String(Math.floor(1000 + Math.random() * 9000));
    const finalPartsData = typeof parts_data === 'object' ? JSON.stringify(parts_data) : (parts_data || '[]');
    let parsedParts = [];
    try {
      parsedParts = typeof parts_data === 'string' ? JSON.parse(parts_data) : (parts_data || []);
    } catch (e) {
      parsedParts = [];
    }

    // Insert maintenance log
    const insertSql = `
      INSERT INTO maintenance_logs (
        bus_id, service_date, service_type, cost, odometer, next_due_date, notes,
        bill_no, workshop_name, mechanic_name, labor_charges, parts_cost, parts_data,
        driver_name, driver_id, job_card_no, mileage, lamp, serial_no
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const result = await query(insertSql, [
      bus_id || null,
      service_date || new Date().toISOString().slice(0, 10),
      service_type || 'General Maintenance',
      cost || 0,
      odometer || null,
      next_due_date || null,
      notes || null,
      finalBillNo,
      workshop_name || 'TMHNU Fleet Workshop',
      mechanic_name || null,
      labor_charges || 0,
      parts_cost || 0,
      finalPartsData,
      driver_name || null,
      driver_id || null,
      finalJobCardNo,
      mileage || null,
      lamp || null,
      serial_no || null
    ]);

    const maintenanceId = result.insertId;

    // Deduct stock for each spare part used
    for (const item of parsedParts) {
      if (item.part_id && Number(item.quantity) > 0) {
        await query(
          'UPDATE inventory_items SET quantity = GREATEST(0, quantity - ?) WHERE id = ?',
          [Number(item.quantity), Number(item.part_id)]
        );
      }
    }

    res.status(201).json({
      success: true,
      id: maintenanceId,
      bill_no: finalBillNo,
      message: 'Maintenance bill created and inventory stock updated successfully'
    });
  } catch (err) {
    console.error('Error saving maintenance log:', err);
    res.status(500).json({ error: err.message || 'Failed to save maintenance record' });
  }
};

/**
 * Update an existing maintenance log, adjusting inventory differences
 */
exports.updateMaintenanceWithParts = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      bus_id,
      service_date,
      service_type,
      cost,
      odometer,
      next_due_date,
      notes,
      bill_no,
      workshop_name,
      mechanic_name,
      labor_charges,
      parts_cost,
      parts_data,
      driver_name,
      driver_id,
      job_card_no,
      mileage,
      lamp,
      serial_no
    } = req.body;

    // 1. Fetch previous record to restore its deducted stock
    const prevRows = await query('SELECT parts_data FROM maintenance_logs WHERE id = ?', [id]);
    if (prevRows.length > 0 && prevRows[0].parts_data) {
      try {
        const oldParts = JSON.parse(prevRows[0].parts_data);
        if (Array.isArray(oldParts)) {
          for (const oldItem of oldParts) {
            if (oldItem.part_id && Number(oldItem.quantity) > 0) {
              await query(
                'UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?',
                [Number(oldItem.quantity), Number(oldItem.part_id)]
              );
            }
          }
        }
      } catch (e) {
        console.error('Error restoring old parts:', e);
      }
    }

    // 2. Parse new parts data
    const finalPartsData = typeof parts_data === 'object' ? JSON.stringify(parts_data) : (parts_data || '[]');
    let parsedParts = [];
    try {
      parsedParts = typeof parts_data === 'string' ? JSON.parse(parts_data) : (parts_data || []);
    } catch (e) {
      parsedParts = [];
    }

    // 3. Deduct new parts from stock
    for (const item of parsedParts) {
      if (item.part_id && Number(item.quantity) > 0) {
        await query(
          'UPDATE inventory_items SET quantity = GREATEST(0, quantity - ?) WHERE id = ?',
          [Number(item.quantity), Number(item.part_id)]
        );
      }
    }

    // 4. Update maintenance log
    const updateSql = `
      UPDATE maintenance_logs SET
        bus_id = ?, service_date = ?, service_type = ?, cost = ?, odometer = ?,
        next_due_date = ?, notes = ?, bill_no = ?, workshop_name = ?,
        mechanic_name = ?, labor_charges = ?, parts_cost = ?, parts_data = ?,
        driver_name = ?, driver_id = ?, job_card_no = ?, mileage = ?, lamp = ?, serial_no = ?
      WHERE id = ?
    `;
    await query(updateSql, [
      bus_id || null,
      service_date || new Date().toISOString().slice(0, 10),
      service_type || 'General Maintenance',
      cost || 0,
      odometer || null,
      next_due_date || null,
      notes || null,
      bill_no || null,
      workshop_name || 'TMHNU Fleet Workshop',
      mechanic_name || null,
      labor_charges || 0,
      parts_cost || 0,
      finalPartsData,
      driver_name || null,
      driver_id || null,
      job_card_no || null,
      mileage || null,
      lamp || null,
      serial_no || null,
      id
    ]);

    res.json({
      success: true,
      message: 'Maintenance bill updated and inventory stock synchronized'
    });
  } catch (err) {
    console.error('Error updating maintenance log:', err);
    res.status(500).json({ error: err.message || 'Failed to update maintenance record' });
  }
};

/**
 * Delete a maintenance log and restore deducted spare parts back to inventory
 */
exports.deleteMaintenanceWithParts = async (req, res) => {
  try {
    const { id } = req.params;

    // Fetch previous record to restore stock
    const rows = await query('SELECT parts_data FROM maintenance_logs WHERE id = ?', [id]);
    if (rows.length > 0 && rows[0].parts_data) {
      try {
        const parts = JSON.parse(rows[0].parts_data);
        if (Array.isArray(parts)) {
          for (const item of parts) {
            if (item.part_id && Number(item.quantity) > 0) {
              await query(
                'UPDATE inventory_items SET quantity = quantity + ? WHERE id = ?',
                [Number(item.quantity), Number(item.part_id)]
              );
            }
          }
        }
      } catch (e) {
        console.error('Error restoring stock on deletion:', e);
      }
    }

    await query('DELETE FROM maintenance_logs WHERE id = ?', [id]);
    res.json({ success: true, message: 'Maintenance record deleted and stock restored' });
  } catch (err) {
    console.error('Error deleting maintenance log:', err);
    res.status(500).json({ error: err.message || 'Failed to delete maintenance record' });
  }
};

/**
 * Get inventory KPI statistics
 */
exports.getInventoryStats = async (req, res) => {
  try {
    const [summary] = await query(`
      SELECT 
        COUNT(*) as total_items,
        COALESCE(SUM(quantity * unit_cost), 0) as total_valuation,
        COALESCE(SUM(CASE WHEN quantity <= min_stock_alert AND quantity > 0 THEN 1 ELSE 0 END), 0) as low_stock_count,
        COALESCE(SUM(CASE WHEN quantity <= 0 THEN 1 ELSE 0 END), 0) as out_of_stock_count
      FROM inventory_items
    `);

    const categories = await query(`
      SELECT category, COUNT(*) as count, COALESCE(SUM(quantity * unit_cost), 0) as valuation
      FROM inventory_items
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      stats: {
        total_items: Number(summary.total_items || 0),
        total_valuation: Number(summary.total_valuation || 0),
        low_stock_count: Number(summary.low_stock_count || 0),
        out_of_stock_count: Number(summary.out_of_stock_count || 0)
      },
      categories
    });
  } catch (err) {
    console.error('Error getting inventory stats:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve inventory statistics' });
  }
};

/**
 * Restock an inventory item
 */
exports.restockItem = async (req, res) => {
  try {
    const { id, add_quantity, new_unit_cost, supplier_name, invoice_no, purchase_date, notes } = req.body;
    if (!id || !add_quantity || Number(add_quantity) <= 0) {
      return res.status(400).json({ error: 'Valid item ID and positive restock quantity are required' });
    }

    const updates = ['quantity = quantity + ?'];
    const params = [Number(add_quantity)];

    if (new_unit_cost !== undefined && new_unit_cost !== '' && Number(new_unit_cost) >= 0) {
      updates.push('unit_cost = ?');
      params.push(Number(new_unit_cost));
    }
    if (supplier_name) {
      updates.push('supplier_name = ?');
      params.push(supplier_name);
    }
    if (invoice_no) {
      updates.push('invoice_no = ?');
      params.push(invoice_no);
    }
    if (purchase_date) {
      updates.push('purchase_date = ?');
      params.push(purchase_date);
    }
    if (notes) {
      updates.push('notes = CONCAT(COALESCE(notes, ""), "\nRestocked on ", CURDATE(), ": ", ?)');
      params.push(notes);
    }

    params.push(id);
    await query(`UPDATE inventory_items SET ${updates.join(', ')} WHERE id = ?`, params);

    const [updated] = await query('SELECT * FROM inventory_items WHERE id = ?', [id]);
    res.json({
      success: true,
      item: updated,
      message: `Successfully restocked ${add_quantity} units.`
    });
  } catch (err) {
    console.error('Error restocking inventory item:', err);
    res.status(500).json({ error: err.message || 'Failed to restock item' });
  }
};
