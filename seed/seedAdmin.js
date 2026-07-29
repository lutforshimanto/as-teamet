// Run once with: npm run seed:admin
// Creates the very first admin account so you have a way to log in and
// start creating employees/clients/tasks through the API.
require('dotenv').config();
const connectDB = require('../config/db');
const User = require('../models/User');
const mongoose = require('mongoose');

async function run() {
  await connectDB();

  const employeeId = process.env.SEED_ADMIN_EMPLOYEE_ID || 'ADM001';
  const existing = await User.findOne({ employeeId });

  if (existing) {
    console.log(`Admin "${employeeId}" already exists. Nothing to do.`);
  } else {
    await User.create({
      name: process.env.SEED_ADMIN_NAME || 'Admin User',
      employeeId,
      role: 'admin',
      speciality: 'Management',
      password: process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!',
    });
    console.log(`Admin created! employeeId: ${employeeId}`);
    console.log('Log in with the password from your .env (SEED_ADMIN_PASSWORD).');
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
