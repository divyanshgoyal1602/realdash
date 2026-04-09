const mongoose = require('mongoose');

const officeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    region: {
      type: String,
      enum: ['North', 'South', 'East', 'West', 'Northeast', 'Central'],
      required: true,
    },
    address: String,
    officerInCharge: String,
    contactEmail: String,
    contactPhone: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Office', officeSchema);
