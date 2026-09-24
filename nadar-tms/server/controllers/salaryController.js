const { query } = require('../db/pool');

/**
 * Clean numeric string to float
 */
const toNum = (v, def = 0) => {
  const n = parseFloat(v);
  return isNaN(n) ? def : Math.round(n * 100) / 100;
};

/**
 * Format date to YYYY-MM-DD or null
 */
const cleanDate = (d) => {
  if (!d) return null;
  const s = String(d).trim();
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
};

// GET /api/salaries
exports.list = async (req, res) => {
  try {
    const { month, institution_id, status, search, driver_id } = req.query;
    const currentMonth = month || new Date().toISOString().slice(0, 7); // 'YYYY-MM'

    let whereSql = ' WHERE s.salary_month = ?';
    const params = [currentMonth];

    // Institution filter
    let targetInst = null;
    if (institution_id && institution_id !== 'all' && institution_id !== 'ALL') {
      targetInst = institution_id;
    } else if (req.user && req.user.role === 'institution' && req.user.institution_id) {
      targetInst = req.user.institution_id;
    }

    if (targetInst) {
      whereSql += ' AND (s.institution_id = ? OR d.institution_id = ?)';
      params.push(targetInst, targetInst);
    }

    if (status && status !== 'all') {
      whereSql += ' AND s.payment_status = ?';
      params.push(status);
    }

    if (driver_id) {
      whereSql += ' AND s.driver_id = ?';
      params.push(Number(driver_id));
    }

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      whereSql += ` AND (LOWER(d.name) LIKE ? OR LOWER(d.employee_code) LIKE ? OR LOWER(d.phone) LIKE ? OR LOWER(d.license_number) LIKE ?)`;
      params.push(q, q, q, q);
    }

    const sql = `
      SELECT 
        s.*,
        d.name AS driver_name,
        d.phone AS driver_phone,
        d.license_number,
        d.employee_code,
        d.photo AS driver_photo,
        d.status AS driver_status,
        COALESCE(i.short_name, i.name, '—') AS institution_name,
        COALESCE(i.id, d.institution_id) AS current_institution_id,
        (
          SELECT GROUP_CONCAT(DISTINCT b.registration_number ORDER BY b.registration_number SEPARATOR ', ')
          FROM assignments a
          JOIN buses b ON b.id = a.bus_id
          WHERE a.driver_id = d.id
        ) AS assigned_bus_numbers,
        (
          SELECT GROUP_CONCAT(DISTINCT r.route_code ORDER BY r.route_code SEPARATOR ', ')
          FROM assignments a
          JOIN routes r ON r.id = a.route_id
          WHERE a.driver_id = d.id
        ) AS assigned_route_codes,
        (
          SELECT GROUP_CONCAT(DISTINCT r.route_name ORDER BY r.route_code SEPARATOR ', ')
          FROM assignments a
          JOIN routes r ON r.id = a.route_id
          WHERE a.driver_id = d.id
        ) AS assigned_route_names
      FROM driver_salaries s
      JOIN drivers d ON d.id = s.driver_id
      LEFT JOIN institutions i ON i.id = COALESCE(s.institution_id, d.institution_id)
      ${whereSql}
      ORDER BY d.name ASC
    `;

    const items = await query(sql, params);

    // Compute KPI stats
    let totalBasic = 0;
    let totalBata = 0;
    let totalGross = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let paidCount = 0;
    let pendingCount = 0;

    items.forEach((item) => {
      const basic = toNum(item.basic_salary);
      const bata = toNum(item.bata_amount) + toNum(item.special_bata);
      const gross = toNum(item.gross_salary);
      const ded = toNum(item.advance_deduction) + toNum(item.epf_deduction) + toNum(item.esi_deduction) + toNum(item.other_deductions);
      const net = toNum(item.net_salary);

      totalBasic += basic;
      totalBata += bata;
      totalGross += gross;
      totalDeductions += ded;
      totalNet += net;

      if (item.payment_status === 'paid') {
        totalPaid += net;
        paidCount++;
      } else {
        totalPending += net;
        pendingCount++;
      }
    });

    // Fetch all driver IDs entered for this month (independent of status/search filters)
    let enteredSql = 'SELECT DISTINCT driver_id FROM driver_salaries WHERE salary_month = ?';
    const enteredParams = [currentMonth];
    if (targetInst) {
      enteredSql += ' AND (institution_id = ? OR driver_id IN (SELECT id FROM drivers WHERE institution_id = ?))';
      enteredParams.push(targetInst, targetInst);
    }
    const enteredRows = await query(enteredSql, enteredParams);
    const enteredDriverIds = enteredRows.map(r => Number(r.driver_id));

    res.json({
      month: currentMonth,
      items,
      entered_driver_ids: enteredDriverIds,
      stats: {
        total_drivers: items.length,
        total_basic: Math.round(totalBasic * 100) / 100,
        total_bata: Math.round(totalBata * 100) / 100,
        total_gross: Math.round(totalGross * 100) / 100,
        total_deductions: Math.round(totalDeductions * 100) / 100,
        total_net: Math.round(totalNet * 100) / 100,
        total_paid: Math.round(totalPaid * 100) / 100,
        total_pending: Math.round(totalPending * 100) / 100,
        paid_count: paidCount,
        pending_count: pendingCount,
      }
    });
  } catch (err) {
    console.error('salaryController.list error:', err);
    res.status(500).json({ error: 'Could not load driver salary list.' });
  }
};

// GET /api/salaries/:id
exports.getById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const sql = `
      SELECT 
        s.*,
        d.name AS driver_name,
        d.phone AS driver_phone,
        d.license_number,
        d.employee_code,
        d.photo AS driver_photo,
        d.father_name,
        d.current_address,
        d.aadhaar_no,
        d.joining_date,
        d.designation,
        COALESCE(i.name, i.short_name, 'NADAR GROUP OF INSTITUTIONS') AS institution_name,
        i.short_name AS institution_short_name,
        (
          SELECT GROUP_CONCAT(DISTINCT b.registration_number ORDER BY b.registration_number SEPARATOR ', ')
          FROM assignments a
          JOIN buses b ON b.id = a.bus_id
          WHERE a.driver_id = d.id
        ) AS assigned_bus_numbers,
        (
          SELECT GROUP_CONCAT(DISTINCT r.route_code ORDER BY r.route_code SEPARATOR ', ')
          FROM assignments a
          JOIN routes r ON r.id = a.route_id
          WHERE a.driver_id = d.id
        ) AS assigned_route_codes,
        (
          SELECT GROUP_CONCAT(DISTINCT r.route_name ORDER BY r.route_code SEPARATOR ', ')
          FROM assignments a
          JOIN routes r ON r.id = a.route_id
          WHERE a.driver_id = d.id
        ) AS assigned_route_names
      FROM driver_salaries s
      JOIN drivers d ON d.id = s.driver_id
      LEFT JOIN institutions i ON i.id = COALESCE(s.institution_id, d.institution_id)
      WHERE s.id = ?
      LIMIT 1
    `;
    const rows = await query(sql, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Salary record not found.' });
    res.json(rows[0]);
  } catch (err) {
    console.error('salaryController.getById error:', err);
    res.status(500).json({ error: 'Could not load salary slip detail.' });
  }
};

// POST /api/salaries (Save or Update)
exports.save = async (req, res) => {
  try {
    const body = req.body || {};
    const driverId = Number(body.driver_id);
    const salaryMonth = (body.salary_month || '').trim().slice(0, 7);

    if (!driverId) return res.status(400).json({ error: 'Please select a driver.' });
    if (!salaryMonth || !/^\d{4}-\d{2}$/.test(salaryMonth)) {
      return res.status(400).json({ error: 'Salary month must be in YYYY-MM format.' });
    }

    const workingDays = Math.max(1, parseInt(body.working_days, 10) || 26);
    const presentDays = Math.max(0, toNum(body.present_days, 26.0));
    const totalTrips = Math.max(0, parseInt(body.total_trips, 10) || 0);

    const basicSalary = toNum(body.basic_salary, 0);
    const dailyBataRate = toNum(body.daily_bata_rate, 0);
    
    // If bata_amount is manually entered, use it; otherwise auto-compute from present_days * daily_bata_rate
    let bataAmount = body.bata_amount !== undefined && body.bata_amount !== '' 
      ? toNum(body.bata_amount) 
      : Math.round(presentDays * dailyBataRate * 100) / 100;

    const specialBata = toNum(body.special_bata, 0);
    const overtimeAmount = toNum(body.overtime_amount, 0);
    const otherAllowances = toNum(body.other_allowances, 0);

    // Compute gross salary
    const grossSalary = Math.round((basicSalary + bataAmount + specialBata + overtimeAmount + otherAllowances) * 100) / 100;

    // Deductions
    const advanceDeduction = toNum(body.advance_deduction, 0);
    const epfDeduction = toNum(body.epf_deduction, 0);
    const esiDeduction = toNum(body.esi_deduction, 0);
    const otherDeductions = toNum(body.other_deductions, 0);

    const totalDeductions = Math.round((advanceDeduction + epfDeduction + esiDeduction + otherDeductions) * 100) / 100;
    const netSalary = Math.max(0, Math.round((grossSalary - totalDeductions) * 100) / 100);

    const paymentStatus = ['paid', 'partially_paid', 'pending'].includes(body.payment_status) ? body.payment_status : 'pending';
    const paymentDate = cleanDate(body.payment_date);
    const paymentMode = ['cash', 'bank_transfer', 'cheque', 'upi'].includes(body.payment_mode) ? body.payment_mode : 'bank_transfer';
    const transactionRef = body.transaction_ref ? String(body.transaction_ref).trim() : null;
    const remarks = body.remarks ? String(body.remarks).trim() : null;
    const institutionId = body.institution_id ? Number(body.institution_id) : null;

    if (body.id) {
      // Direct update by ID
      const updateSql = `
        UPDATE driver_salaries SET
          driver_id = ?,
          institution_id = ?,
          salary_month = ?,
          working_days = ?,
          present_days = ?,
          total_trips = ?,
          basic_salary = ?,
          daily_bata_rate = ?,
          bata_amount = ?,
          special_bata = ?,
          overtime_amount = ?,
          other_allowances = ?,
          gross_salary = ?,
          advance_deduction = ?,
          epf_deduction = ?,
          esi_deduction = ?,
          other_deductions = ?,
          net_salary = ?,
          payment_status = ?,
          payment_date = ?,
          payment_mode = ?,
          transaction_ref = ?,
          remarks = ?
        WHERE id = ?
      `;
      await query(updateSql, [
        driverId, institutionId, salaryMonth,
        workingDays, presentDays, totalTrips,
        basicSalary, dailyBataRate, bataAmount, specialBata, overtimeAmount, otherAllowances,
        grossSalary, advanceDeduction, epfDeduction, esiDeduction, otherDeductions,
        netSalary, paymentStatus, paymentDate, paymentMode, transactionRef, remarks,
        Number(body.id)
      ]);
      return res.json({ id: Number(body.id), message: 'Salary record updated successfully.' });
    }

    // If creating a new record, verify this driver doesn't already have an entry for this month
    if (!body.id) {
      const existing = await query(
        'SELECT id FROM driver_salaries WHERE driver_id = ? AND salary_month = ? LIMIT 1',
        [driverId, salaryMonth]
      );
      if (existing && existing.length > 0) {
        return res.status(400).json({
          error: 'This driver already has a salary record for this month. Please edit the existing record instead.'
        });
      }
    }

    // Insert new salary record
    const upsertSql = `
      INSERT INTO driver_salaries (
        driver_id, institution_id, salary_month,
        working_days, present_days, total_trips,
        basic_salary, daily_bata_rate, bata_amount, special_bata, overtime_amount, other_allowances,
        gross_salary, advance_deduction, epf_deduction, esi_deduction, other_deductions,
        net_salary, payment_status, payment_date, payment_mode, transaction_ref, remarks
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        institution_id = VALUES(institution_id),
        working_days = VALUES(working_days),
        present_days = VALUES(present_days),
        total_trips = VALUES(total_trips),
        basic_salary = VALUES(basic_salary),
        daily_bata_rate = VALUES(daily_bata_rate),
        bata_amount = VALUES(bata_amount),
        special_bata = VALUES(special_bata),
        overtime_amount = VALUES(overtime_amount),
        other_allowances = VALUES(other_allowances),
        gross_salary = VALUES(gross_salary),
        advance_deduction = VALUES(advance_deduction),
        epf_deduction = VALUES(epf_deduction),
        esi_deduction = VALUES(esi_deduction),
        other_deductions = VALUES(other_deductions),
        net_salary = VALUES(net_salary),
        payment_status = VALUES(payment_status),
        payment_date = VALUES(payment_date),
        payment_mode = VALUES(payment_mode),
        transaction_ref = VALUES(transaction_ref),
        remarks = VALUES(remarks)
    `;

    const r = await query(upsertSql, [
      driverId, institutionId, salaryMonth,
      workingDays, presentDays, totalTrips,
      basicSalary, dailyBataRate, bataAmount, specialBata, overtimeAmount, otherAllowances,
      grossSalary, advanceDeduction, epfDeduction, esiDeduction, otherDeductions,
      netSalary, paymentStatus, paymentDate, paymentMode, transactionRef, remarks
    ]);

    res.status(201).json({ id: r.insertId || body.id, message: 'Salary record saved successfully.' });
  } catch (err) {
    console.error('salaryController.save error:', err);
    res.status(500).json({ error: err.message || 'Could not save salary record.' });
  }
};

// DELETE /api/salaries/:id
exports.remove = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await query('DELETE FROM driver_salaries WHERE id = ?', [id]);
    res.json({ ok: true, message: 'Salary record deleted.' });
  } catch (err) {
    console.error('salaryController.remove error:', err);
    res.status(500).json({ error: 'Could not delete salary record.' });
  }
};

// POST /api/salaries/auto-generate
// Auto-populates all active drivers for a given month with default basic salary and daily bata
exports.autoGenerate = async (req, res) => {
  try {
    const { month, institution_id, default_basic, default_bata_rate, working_days } = req.body || {};
    const salaryMonth = (month || '').trim().slice(0, 7) || new Date().toISOString().slice(0, 7);

    let targetInst = null;
    if (institution_id && institution_id !== 'all' && institution_id !== 'ALL') {
      targetInst = institution_id;
    } else if (req.user && req.user.role === 'institution' && req.user.institution_id) {
      targetInst = req.user.institution_id;
    }

    let drvSql = `SELECT id, name, institution_id FROM drivers WHERE status = 'active'`;
    const drvParams = [];
    if (targetInst) {
      drvSql += ` AND institution_id = ?`;
      drvParams.push(targetInst);
    }
    const drivers = await query(drvSql, drvParams);

    const wDays = Math.max(1, parseInt(working_days, 10) || 26);
    const basic = toNum(default_basic, 18000.00);
    const bataRate = toNum(default_bata_rate, 200.00); // Default ₹200/day bata
    const bataAmt = Math.round(wDays * bataRate * 100) / 100;
    const gross = Math.round((basic + bataAmt) * 100) / 100;
    const net = gross;

    let createdCount = 0;
    for (const d of drivers) {
      const [existing] = await query(
        `SELECT id FROM driver_salaries WHERE driver_id = ? AND salary_month = ? LIMIT 1`,
        [d.id, salaryMonth]
      );
      if (!existing) {
        await query(
          `INSERT INTO driver_salaries (
            driver_id, institution_id, salary_month,
            working_days, present_days, basic_salary, daily_bata_rate,
            bata_amount, gross_salary, net_salary, payment_status
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
          [d.id, d.institution_id || targetInst || null, salaryMonth, wDays, wDays, basic, bataRate, bataAmt, gross, net]
        );
        createdCount++;
      }
    }

    res.json({
      ok: true,
      month: salaryMonth,
      created: createdCount,
      total_drivers: drivers.length,
      message: `Generated salary & bata entries for ${createdCount} driver(s) for ${salaryMonth}.`
    });
  } catch (err) {
    console.error('salaryController.autoGenerate error:', err);
    res.status(500).json({ error: 'Could not auto-generate driver salary entries.' });
  }
};

// POST /api/salaries/bulk-mark-paid
exports.bulkMarkPaid = async (req, res) => {
  try {
    const { ids, payment_date, payment_mode, transaction_ref } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Please select at least one salary record.' });
    }

    const pDate = cleanDate(payment_date) || new Date().toISOString().slice(0, 10);
    const pMode = ['cash', 'bank_transfer', 'cheque', 'upi'].includes(payment_mode) ? payment_mode : 'bank_transfer';
    const tRef = transaction_ref ? String(transaction_ref).trim() : null;

    const numIds = ids.map(Number).filter(Boolean);
    if (!numIds.length) return res.status(400).json({ error: 'Invalid IDs.' });

    await query(
      `UPDATE driver_salaries SET
        payment_status = 'paid',
        payment_date = ?,
        payment_mode = ?,
        transaction_ref = COALESCE(?, transaction_ref)
      WHERE id IN (?)`,
      [pDate, pMode, tRef, numIds]
    );

    res.json({ ok: true, count: numIds.length, message: `Marked ${numIds.length} salary records as Paid.` });
  } catch (err) {
    console.error('salaryController.bulkMarkPaid error:', err);
    res.status(500).json({ error: 'Could not update payment status.' });
  }
};
