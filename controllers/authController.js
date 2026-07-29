
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// POST /api/auth/login
// Any user (admin or employee) logs in with their employeeId + password
async function login(req, res, next) {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: 'employeeId and password are required' });
    }

    const user = await User.findOne({ employeeId }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid employeeId or password' });
    }

    if (!user.password) {
      return res.status(400).json({
        message: 'This account has not been activated yet. Use /api/auth/register with your employeeId to set your password first.',
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid employeeId or password' });
    }

    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        speciality: user.speciality,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/signup
// Only an admin can create new accounts (employees included). This route
// is protected + admin-only in routes/authRoutes.js.
// Password is OPTIONAL here: an admin can create a "shell" account (no
// password) and let the employee set their own password later via
// POST /api/auth/register. Or, if the admin prefers, they can set an
// initial password directly by including it in this request.
async function signup(req, res, next) {
  try {
    const { name, employeeId, address, phone, role, speciality, password } = req.body;

    if (!name || !employeeId) {
      return res.status(400).json({ message: 'name and employeeId are required' });
    }

    const existing = await User.findOne({ employeeId });
    if (existing) {
      return res.status(409).json({ message: 'employeeId already in use' });
    }

    const user = await User.create({
      name,
      employeeId,
      address,
      phone,
      role: role === 'admin' ? 'admin' : 'employee', // never trust client to self-promote
      speciality,
      password, // may be undefined — that's fine, see model
    });

    res.status(201).json({
      id: user._id,
      name: user.name,
      employeeId: user.employeeId,
      role: user.role,
      activated: !!password,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/register  (public — no login required)
// Lets an employee "claim" an account an admin already created for them,
// by setting their own password. Only works if:
//   1. That employeeId actually exists (admin made the shell account), and
//   2. It doesn't already have a password (can't re-claim someone's account)
async function register(req, res, next) {
  try {
    const { employeeId, password } = req.body;

    if (!employeeId || !password) {
      return res.status(400).json({ message: 'employeeId and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: 'password must be at least 6 characters' });
    }

    const user = await User.findOne({ employeeId }).select('+password');
    if (!user) {
      return res.status(404).json({
        message: 'No account found for this employeeId. Ask your admin to create one first.',
      });
    }
    if (user.password) {
      return res.status(409).json({
        message: 'This account is already activated. Log in instead, or ask an admin to reset your password.',
      });
    }

    user.password = password; // pre-save hook hashes this
    await user.save();

    // Log them straight in, since they just proved who they are
    const token = generateToken(user);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        employeeId: user.employeeId,
        role: user.role,
        speciality: user.speciality,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, signup, register };