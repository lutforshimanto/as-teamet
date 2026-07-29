const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    employeeId: { type: String, required: true, unique: true, trim: true },
    address: { type: String, trim: true },
    phone: { type: String, trim: true },
    role: { type: String, enum: ['admin', 'employee'], default: 'employee' },
    speciality: { type: String, trim: true },
    password: { type: String, select: false },
  },
  { timestamps: true }
);

// Hash the password automatically whenever it's set/changed
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
