// Sets (or resets) a user's password. Works even on documents imported
// directly into MongoDB that never had a real password set.
//
// Usage:
//   npm run set-password -- <employeeId> <newPassword>
// Example:
//   npm run set-password -- ADM001 ChangeMe123!
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');

async function run() {
  const employeeId = process.argv[2];
  const newPassword = process.argv[3];

  if (!employeeId || !newPassword) {
    console.log('Usage: npm run set-password -- <employeeId> <newPassword>');
    process.exit(1);
  }

  await connectDB();

  const user = await User.findOne({ employeeId }).select('+password');
  if (!user) {
    console.log(`No user found with employeeId "${employeeId}".`);
  } else {
    user.password = newPassword; // pre-save hook hashes this automatically
    await user.save();
    console.log(`Password updated for ${employeeId} (${user.name}).`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
