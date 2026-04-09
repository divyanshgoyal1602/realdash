const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema(
  {
    office: { type: mongoose.Schema.Types.ObjectId, ref: 'Office', required: true },
    date: { type: Date, required: true, default: Date.now },
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
    activityName: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    targetValue: { type: Number, default: 0 },
    achievedValue: { type: Number, default: 0 },
    unit: { type: String, default: 'Nos' },
    expenditure: { type: Number, default: 0 },
    budget: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['Planned', 'In Progress', 'Completed', 'Delayed', 'Cancelled'],
      default: 'Planned',
    },
    remarks: String,
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    aapTarget: { type: mongoose.Schema.Types.ObjectId, ref: 'AAPTarget' },
    attachments: [{ name: String, url: String }],
  },
  { timestamps: true }
);

// Virtual: completion percentage
activitySchema.virtual('completionPct').get(function () {
  if (!this.targetValue || this.targetValue === 0) return 0;
  return Math.min(Math.round((this.achievedValue / this.targetValue) * 100), 100);
});

activitySchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Activity', activitySchema);
