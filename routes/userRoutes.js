const express = require('express');
const {
  getUsers,
  getMe,
  getUserById,
  updateMe,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect); // every route below requires a valid login

router.get('/me', getMe);
router.patch('/me', updateMe);

router.get('/', adminOnly, getUsers);
router.get('/:id', adminOnly, getUserById);
router.patch('/:id', adminOnly, updateUser);
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
