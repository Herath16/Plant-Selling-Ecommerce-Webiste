// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const { isAdmin } = require('./auth'); // Assuming isAdmin is a middleware

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

// --- CORE PRODUCT MANAGEMENT (Admin) ---

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
    // FIX: Added comma between stock_quantity = ? AND image_url = ?
    const query = 'UPDATE products SET name = ?, price = ?, stock_quantity = ?, image_url = ? WHERE id = ?';
    
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
router.put('/increase-stock/:id', isAdmin, (req, res) => {
    const productId = req.params.id;
    const { increaseAmount } = req.body; 

    if (!increaseAmount || isNaN(parseInt(increaseAmount))) {
        return res.status(400).json({ message: 'Invalid increase amount.' });
    }

    const amount = parseInt(increaseAmount);
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

// ----------------------------------------------------------------------
// --- PRODUCT DETAIL AND REVIEWS (REQUIRED FOR product-detail.js) ---
// ----------------------------------------------------------------------

// 🚀 FIX: MOVED THIS MORE SPECIFIC ROUTE TO THE TOP OF THIS SECTION!
// GET /products/:id/reviews (NEW: Fetch all reviews for a product)
router.get('/:id/reviews', (req, res) => {
    const productId = req.params.id;

    const sql = `SELECT pr.id, pr.rating, pr.review_title AS title, pr.review_text, pr.date_created AS created_at, u.username FROM product_reviews pr JOIN users u ON pr.user_id = u.id WHERE pr.product_id = ? ORDER BY pr.date_created DESC;`;

    db.query(sql, [productId], (err, results) => {
        if (err) {
            console.error('Database error fetching product reviews:', err);
            return res.status(500).json({ message: 'Internal server error.' });
        }
        res.json(results);
    });
});

// 🚀 FIX: THIS MORE GENERIC ROUTE IS NOW BELOW THE SPECIFIC ONE.
// GET /products/:id (UPDATED: Fetch single product with aggregated review data)
router.get('/:id', (req, res) => {
    const productId = req.params.id;

    const sql = `SELECT p.id, p.name, p.price, p.stock_quantity, p.image_url, COALESCE(AVG(pr.rating), 0) AS average_rating, COUNT(pr.id) AS review_count FROM products p LEFT JOIN product_reviews pr ON p.id = pr.product_id WHERE p.id = ? GROUP BY p.id;`;

    db.query(sql, [productId], (err, results) => {
        if (err) {
            console.error('Database error fetching product details:', err);
            return res.status(500).json({ message: 'Internal server error.' });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const product = results[0];
        // Ensure price and rating are correctly formatted for the frontend
        product.average_rating = parseFloat(product.average_rating).toFixed(1);
        product.review_count = parseInt(product.review_count);
        product.price = parseFloat(product.price);

        res.json(product);
    });
});

// POST /products/review (This route was already correctly positioned)
router.post('/review', (req, res) => {
    // Note: If you have proper user authentication middleware, you should get user_id from req.user
    const { user_id, product_id, rating, title, review_text } = req.body;

    if (!user_id || !product_id || !rating || !title || !review_text) {
        return res.status(400).json({ message: 'Missing required fields for review.' });
    }

    const sql = `INSERT INTO product_reviews (product_id, user_id, rating, review_title, review_text) VALUES (?, ?, ?, ?, ?);`;
    const values = [product_id, user_id, rating, title, review_text];

    db.query(sql, values, (err, result) => {
        if (err) {
            console.error('Database error submitting review:', err);
            return res.status(500).json({ message: 'Failed to submit review due to a server error.' });
        }
        res.status(201).json({ 
            message: 'Review added successfully!', 
            reviewId: result.insertId 
        });
    });
});

module.exports = router;