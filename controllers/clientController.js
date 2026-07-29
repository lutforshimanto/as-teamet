const Client = require('../models/Client');

// POST /api/clients  (admin only)
async function createClient(req, res, next) {
  try {
    const { name, address, phone } = req.body;
    if (!name) return res.status(400).json({ message: 'name is required' });

    const client = await Client.create({ name, address, phone });
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
}

// GET /api/clients  (any logged-in user)
async function getClients(req, res, next) {
  try {
    const clients = await Client.find().sort({ name: 1 });
    res.json(clients);
  } catch (err) {
    next(err);
  }
}

// GET /api/clients/:id
async function getClientById(req, res, next) {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/clients/:id  (admin only)
async function updateClient(req, res, next) {
  try {
    const { name, address, phone } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { name, address, phone },
      { new: true, runValidators: true }
    );
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json(client);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/clients/:id  (admin only)
async function deleteClient(req, res, next) {
  try {
    const client = await Client.findByIdAndDelete(req.params.id);
    if (!client) return res.status(404).json({ message: 'Client not found' });
    res.json({ message: 'Client deleted' });
  } catch (err) {
    next(err);
  }
}

module.exports = { createClient, getClients, getClientById, updateClient, deleteClient };
