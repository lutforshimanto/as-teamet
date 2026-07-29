const mongoose = require('mongoose');

const hoursLogSchema = new mongoose.Schema(
  {
    serial: { type: Number, required: true, default: 0 },
    date: { type: Date, required: true },
    hours: { type: Number, required: true, min: 0 },
    startTime: { type: String, required: true, trim: true },
    endTime: { type: String, required: true, trim: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String, trim: true },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    taskType: { type: String, required: true, trim: true },
    numEmployees: { type: Number, required: true, min: 1 },
    description: { type: String, trim: true },

    assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },

    // When the job is scheduled to happen. Used for the "tasks in a
    // month / date range" feature, and these are the two fields
    // non-admin employees are allowed to edit.
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'cancelled'],
      default: 'pending',
    },

    hoursLogged: [hoursLogSchema],
    photos: [{ type: String, trim: true }],

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

// Speeds up the "give me all tasks in this date range" queries
taskSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model('Task', taskSchema);
