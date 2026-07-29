const express = require('express');
const {
  createClient,
  getClients,
  getClientById,
  updateClient,
  deleteClient,
} = require('../controllers/clientController');
const { protect, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getClients);
router.get('/:id', getClientById);

router.post('/', adminOnly, createClient);
router.patch('/:id', adminOnly, updateClient);
router.delete('/:id', adminOnly, deleteClient);

module.exports = router;
