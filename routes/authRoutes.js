
const express = require('express');
const { login, signup, register } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);

// Public — employee activates a shell account an admin already created
router.post('/register', register);

// Only an admin can create new user accounts (employees or other admins).
// This keeps random people from signing themselves up from scratch.
router.post('/signup', protect, adminOnly, signup);

module.exports = router;