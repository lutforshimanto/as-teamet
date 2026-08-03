const express = require('express');
const {
  getUsers,
  getMe,
  getUserById,
  updateMe,
  updateUser,
  deleteUser,
  getUserDirectory,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // every route below requires a valid login

router.get('/me', getMe);
router.patch('/me', updateMe);

router.get('/directory', getUserDirectory); // any logged-in user — minimal fields

router.get('/', adminOnly, getUsers);
router.get('/:id', adminOnly, getUserById);
router.patch('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;