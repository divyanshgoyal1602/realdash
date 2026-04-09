const Activity = require('../models/Activity');
const Office = require('../models/Office');
const AAPTarget = require('../models/AAPTarget');
const Alert = require('../models/Alert');
const mongoose = require('mongoose');

// GET /api/dashboard/summary
exports.getSummary = async (req, res) => {
  try {
    const { financialYear = '2024-25' } = req.query;
    const offices = await Office.find({ isActive: true });

    // Build per-office performance
    const officeStats = await Promise.all(
      offices.map(async (office) => {
        const targets = await AAPTarget.find({ office: office._id, financialYear });
        const activities = await Activity.find({ office: office._id });

        const totalTarget = targets.reduce((s, t) => s + t.annualTarget, 0);
        const totalBudget = targets.reduce((s, t) => s + t.annualBudget, 0);
        const achieved = activities.reduce((s, a) => s + a.achievedValue, 0);
        const spent = activities.reduce((s, a) => s + a.expenditure, 0);
        const completed = activities.filter((a) => a.status === 'Completed').length;
        const delayed = activities.filter((a) => a.status === 'Delayed').length;

        // Submission streak: did office submit today?
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const submittedToday = await Activity.exists({ office: office._id, date: { $gte: today } });

        const completionPct = totalTarget > 0 ? Math.min(Math.round((achieved / totalTarget) * 100), 100) : 0;
        const budgetUtilPct = totalBudget > 0 ? Math.min(Math.round((spent / totalBudget) * 100), 100) : 0;

        return {
          _id: office._id,
          name: office.name,
          code: office.code,
          city: office.city,
          state: office.state,
          region: office.region,
          officerInCharge: office.officerInCharge,
          completionPct,
          budgetUtilPct,
          totalActivities: activities.length,
          completed,
          delayed,
          submittedToday: !!submittedToday,
          totalTarget,
          achieved,
          totalBudget,
          spent,
        };
      })
    );

    // Ministry-level aggregates
    const totalOffices = officeStats.length;
    const avgCompletion = Math.round(officeStats.reduce((s, o) => s + o.completionPct, 0) / totalOffices);
    const submittedToday = officeStats.filter((o) => o.submittedToday).length;
    const delayedCount = officeStats.filter((o) => o.delayed > 0).length;
    const unreadAlerts = await Alert.countDocuments({ isRead: false });

    res.json({
      summary: { totalOffices, avgCompletion, submittedToday, delayedCount, unreadAlerts },
      offices: officeStats,
      financialYear,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/dashboard/trends
exports.getTrends = async (req, res) => {
  try {
    const { days = 180, officeId } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const match = { date: { $gte: since } };
    if (officeId) match.office = new mongoose.Types.ObjectId(officeId);

    const trends = await Activity.aggregate([
      { $match: match },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 },
          achieved: { $sum: '$achievedValue' },
          spent: { $sum: '$expenditure' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({ trends });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/dashboard/category-breakdown
exports.getCategoryBreakdown = async (req, res) => {
  try {
    const { officeId, financialYear = '2024-25' } = req.query;
    const match = {};
    if (officeId) match.office = new mongoose.Types.ObjectId(officeId);

    const breakdown = await Activity.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
          achieved: { $sum: '$achievedValue' },
          spent: { $sum: '$expenditure' },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
        },
      },
      { $sort: { count: -1 } },
    ]);

    res.json({ breakdown });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
