const express = require('express');
const router = express.Router();
const dbService = require('../services/dbService');

// Get all users for role switcher
router.get('/', async (req, res, next) => {
  try {
    const users = await dbService.getUsers();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
