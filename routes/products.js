const express = require('express');
const router = express.Router();
const db = require('../db');
const { isAdmin } = require('./auth');

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


// POST /products/add (Admin-only)
router.post('/add', isAdmin, (req, res) => {
    const { name, price, image_url} = req.body;
    const query = 'INSERT INTO products (name, price, image_url) VALUES (?, ?, ?)';
    
    db.query(query, [name, price, image_url], (err, result) => {
        if (err) {
            console.error('Error adding product:', err);
            return res.status(500).send('Server error');
        }
        res.status(201).json({ message: 'Product added successfully!', productId: result.insertId });
    });
});

// PUT /products/update/:id (Admin-only)
router.put('/update/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const { name, price, image_url} = req.body;
    const query = 'UPDATE products SET name = ?, price = ?, image_url = ? WHERE id = ?';
    
    db.query(query, [name, price, image_url, id], (err, result) => {
        if (err) {
            console.error('Error updating product:', err);
            return res.status(500).send('Server error');
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product updated successfully.' });
    });
});

// DELETE /products/delete/:id (Admin-only)
router.delete('/delete/:id', isAdmin, (req, res) => {
    const { id } = req.params;
    const query = 'DELETE FROM products WHERE id = ?';
    
    db.query(query, [id], (err, result) => {
        if (err) {
            console.error('Error deleting product:', err);
            return res.status(500).send('Server error');
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({ message: 'Product deleted successfully.' });
    });
});

module.exports = router;
