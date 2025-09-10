const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /products
router.get('/', (req, res) => {
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).send('Server error');
    } else {
      res.json(results);
    }
  });
});

module.exports = router;
