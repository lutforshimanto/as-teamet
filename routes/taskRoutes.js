const express = require('express');
const {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  updateTaskProgress,
  logHours,
  addPhoto,
  deleteTask,
} = require('../controllers/taskController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getTasks); // ?month=2026-07 or ?startDate=&endDate= or ?status= or ?mine=true
router.get('/:id', getTaskById);

router.post('/', adminOnly, createTask);
router.patch('/:id', adminOnly, updateTask); // full update, admin only

// employees (or admin) can only touch startDate/endDate/status
router.patch('/:id/progress', updateTaskProgress);

router.post('/:id/hours', logHours);
router.post('/:id/photos', addPhoto);

router.delete('/:id', adminOnly, deleteTask);

module.exports = router;
