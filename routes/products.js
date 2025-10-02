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
    const { name, price, stock_quantity, image_url} = req.body;
    const query = 'INSERT INTO products (name, price, stock_quantity, image_url) VALUES (?, ?, ?, ?)';
    
    db.query(query, [name, price, stock_quantity, image_url], (err, result) => {
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
    const { name, price, stock_quantity, image_url} = req.body;
    const query = 'UPDATE products SET name = ?, price = ?, stock_quantity = ? image_url = ? WHERE id = ?';
    
    db.query(query, [name, price, stock_quantity, image_url, id], (err, result) => {
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

// PUT /products/increase-stock/:id (Admin-only)
// This route increases the stock_quantity by the specified amount
router.put('/increase-stock/:id', isAdmin, (req, res) => {
    const productId = req.params.id;
    // Get the amount to increase by (e.g., 5, 10, etc.)
    const { increaseAmount, userId } = req.body; 

    // Basic validation
    if (!increaseAmount || isNaN(parseInt(increaseAmount))) {
        return res.status(400).json({ message: 'Invalid increase amount.' });
    }

    const amount = parseInt(increaseAmount);

    // SQL to update and increase the stock_quantity
    const query = 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?';

    db.query(query, [amount, productId], (err, result) => {
        if (err) {
            console.error('Error increasing stock:', err);
            return res.status(500).send('Server error');
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        res.status(200).json({ message: `Stock for product ID ${productId} increased by ${amount}.` });
    });
});

module.exports = router;
