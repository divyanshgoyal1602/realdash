const router = require('express').Router();
const Activity = require('../models/Activity');
const AAPTarget = require('../models/AAPTarget');
const Office = require('../models/Office');
const { protect, authorize } = require('../middleware/auth');
const ExcelJS = require('exceljs');

// GET /api/reports/office-performance
router.get('/office-performance', protect, async (req, res) => {
  try {
    const { financialYear = '2024-25', officeId } = req.query;
    const officeFilter = officeId ? { _id: officeId } : { isActive: true };
    const offices = await Office.find(officeFilter);

    const report = await Promise.all(
      offices.map(async (office) => {
        const targets = await AAPTarget.find({ office: office._id, financialYear });
        const activities = await Activity.find({ office: office._id });

        const byCategory = {};
        for (const t of targets) {
          if (!byCategory[t.category]) {
            byCategory[t.category] = { target: 0, achieved: 0, budget: 0, spent: 0, activities: [] };
          }
          byCategory[t.category].target += t.annualTarget;
          byCategory[t.category].budget += t.annualBudget;
        }
        for (const a of activities) {
          if (!byCategory[a.category]) {
            byCategory[a.category] = { target: 0, achieved: 0, budget: 0, spent: 0, activities: [] };
          }
          byCategory[a.category].achieved += a.achievedValue;
          byCategory[a.category].spent += a.expenditure;
          byCategory[a.category].activities.push({ name: a.activityName, status: a.status, date: a.date });
        }

        return { office: { name: office.name, code: office.code, city: office.city }, byCategory };
      })
    );

    res.json({ report, financialYear });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/reports/export-excel
router.get('/export-excel', protect, authorize('superadmin', 'ministry', 'office_admin'), async (req, res) => {
  try {
    const { financialYear = '2024-25' } = req.query;
    const offices = await Office.find({ isActive: true });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RealDash – Ministry of Tourism';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Summary', {
      pageSetup: { paperSize: 9, orientation: 'landscape' },
    });

    summarySheet.columns = [
      { header: 'Office', key: 'office', width: 30 },
      { header: 'Code', key: 'code', width: 10 },
      { header: 'City', key: 'city', width: 18 },
      { header: 'Region', key: 'region', width: 14 },
      { header: 'Total Activities', key: 'totalActivities', width: 18 },
      { header: 'Completed', key: 'completed', width: 14 },
      { header: 'Delayed', key: 'delayed', width: 12 },
      { header: 'Annual Target', key: 'target', width: 16 },
      { header: 'Achieved', key: 'achieved', width: 14 },
      { header: 'Completion %', key: 'completion', width: 14 },
      { header: 'Budget (₹)', key: 'budget', width: 16 },
      { header: 'Spent (₹)', key: 'spent', width: 14 },
      { header: 'Utilisation %', key: 'utilisation', width: 14 },
    ];

    // Style header row
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a56db' } };
    summarySheet.getRow(1).alignment = { horizontal: 'center', vertical: 'middle' };
    summarySheet.getRow(1).height = 20;

    for (const office of offices) {
      const targets = await AAPTarget.find({ office: office._id, financialYear });
      const activities = await Activity.find({ office: office._id });
      const totalTarget = targets.reduce((s, t) => s + t.annualTarget, 0);
      const totalBudget = targets.reduce((s, t) => s + t.annualBudget, 0);
      const achieved = activities.reduce((s, a) => s + a.achievedValue, 0);
      const spent = activities.reduce((s, a) => s + a.expenditure, 0);
      const completed = activities.filter((a) => a.status === 'Completed').length;
      const delayed = activities.filter((a) => a.status === 'Delayed').length;

      const completionPct = totalTarget > 0 ? Math.round((achieved / totalTarget) * 100) : 0;
      const utilisationPct = totalBudget > 0 ? Math.round((spent / totalBudget) * 100) : 0;

      const row = summarySheet.addRow({
        office: office.name,
        code: office.code,
        city: office.city,
        region: office.region,
        totalActivities: activities.length,
        completed,
        delayed,
        target: totalTarget,
        achieved,
        completion: `${completionPct}%`,
        budget: totalBudget,
        spent,
        utilisation: `${utilisationPct}%`,
      });

      // Color code low performers
      if (completionPct < 30) {
        row.getCell('completion').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE4E4' } };
        row.getCell('completion').font = { color: { argb: 'FFB91C1C' } };
      } else if (completionPct >= 75) {
        row.getCell('completion').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } };
        row.getCell('completion').font = { color: { argb: 'FF065F46' } };
      }
    }

    // Freeze top row
    summarySheet.views = [{ state: 'frozen', ySplit: 1 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=RealDash_Report_${financialYear}.xlsx`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
