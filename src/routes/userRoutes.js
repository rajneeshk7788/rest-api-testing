const express = require('express');
const User = require('../models/User');

const router = express.Router();
const userFields = new Set(['firstName', 'lastName', 'email', 'phone', 'age']);

function badRequest(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

function parseUserInput(body, partial = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw badRequest('A JSON object is required');
  }

  const entries = Object.entries(body);
  if (entries.some(([key]) => !userFields.has(key))) {
    throw badRequest('Only firstName, lastName, email, phone, and age are allowed');
  }

  if (entries.length === 0) {
    throw badRequest('At least one user field is required');
  }

  if (!partial) {
    for (const field of ['firstName', 'lastName', 'email']) {
      if (body[field] === undefined) {
        throw badRequest(`${field} is required`);
      }
    }
  }

  for (const [field, value] of entries) {
    if (['firstName', 'lastName', 'email', 'phone'].includes(field)) {
      if (typeof value !== 'string' || (field !== 'phone' && value.trim() === '')) {
        throw badRequest(`${field} must be a non-empty string`);
      }
      if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
        throw badRequest('email must be a valid email address');
      }
    }

    if (field === 'age' && (!Number.isInteger(value) || value < 0)) {
      throw badRequest('age must be a non-negative whole number');
    }
  }

  return Object.fromEntries(entries);
}

function validateId(req, res, next) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid user id' });
  }
  req.userId = id;
  return next();
}

router.get('/', async (req, res) => {
  const users = await User.findAll();
  res.json({ data: users });
});

router.get('/:id', validateId, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ data: user });
});

router.post('/', async (req, res) => {
  const user = await User.create(parseUserInput(req.body));
  res.status(201).json({ data: user });
});

router.patch('/:id', validateId, async (req, res) => {
  const changes = parseUserInput(req.body, true);
  const user = await User.updateById(req.userId, changes);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.json({ data: user });
});

router.delete('/:id', validateId, async (req, res) => {
  const user = await User.deleteById(req.userId);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  return res.status(204).end();
});

module.exports = router;
