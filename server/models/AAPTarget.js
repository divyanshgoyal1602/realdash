const mongoose = require('mongoose');

const aapTargetSchema = new mongoose.Schema(
  {
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
    financialYear: { type: String, required: true }, // e.g. "2024-25"
    category: {
      type: String,
      required: true,
      enum: [
        'Tourism Promotion',
        'Tourist Facilitation',
        'Media & Publicity',
        'Fairs & Festivals',
        'Training & Capacity Building',
        'Infrastructure Development',
        'Market Development Assistance',
        'Survey & Research',
        'Coordination',
        'Other',
      ],
    },
    activityName: { type: String, required: true },
    annualTarget: { type: Number, required: true },
    unit: { type: String, default: 'Nos' },
    annualBudget: { type: Number, default: 0 },
    quarter: {
      Q1: { target: { type: Number, default: 0 }, budget: { type: Number, default: 0 } },
      Q2: { target: { type: Number, default: 0 }, budget: { type: Number, default: 0 } },
      Q3: { target: { type: Number, default: 0 }, budget: { type: Number, default: 0 } },
      Q4: { target: { type: Number, default: 0 }, budget: { type: Number, default: 0 } },
    },
    approvedBy: String,
    approvedDate: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AAPTarget', aapTargetSchema);
