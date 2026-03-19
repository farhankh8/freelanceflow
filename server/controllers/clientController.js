const Client = require('../models/Client');

const getClients = async (req, res) => {
  try {
    const clients = await Client.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: clients.length, clients });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const createClient = async (req, res) => {
  try {
    const { name, email, phone, company, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const client = await Client.create({ user: req.user.id, name, email, phone, company, address, notes });
    res.status(201).json({ success: true, client });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const getClient = async (req, res) => {
  try {
    const client = await Client.findOne({ _id: req.params.id, user: req.user.id });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.status(200).json({ success: true, client });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const updateClient = async (req, res) => {
  try {
    const client = await Client.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.status(200).json({ success: true, client });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

const deleteClient = async (req, res) => {
  try {
    const client = await Client.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.status(200).json({ success: true, message: 'Client deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error', message: error.message });
  }
};

module.exports = { getClients, createClient, getClient, updateClient, deleteClient };