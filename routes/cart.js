
const express = require('express');
const router = express.Router();
const db = require('../db'); // Correctly imports the single database connection

// Middleware to parse JSON bodies
router.use(express.json());

// GET /api/cart/:userId

router.get('/:id', (req, res) => {
    const userId = parseInt(req.params.id);
    const query = `
        SELECT ci.quantity, p.id, p.name, p.price, p.image_url
        FROM cart_items ci
        JOIN products p ON ci.product_id = p.id
        WHERE ci.user_id = ?`;

    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching cart items:', err);
            res.status(500).send('Server error');
        } else {
            res.json(results);
        }
    });
});

// POST /cart/add
router.post('/add', (req, res) => {
    const { userId, productId, quantity } = req.body;

    // Check for required data
    if (!userId || !productId || !quantity) {
        return res.status(400).json({ message: 'User ID, Product ID, and quantity are required.' });
    }

    // Check if the item already exists for the user
    const checkQuery = `SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`;
    db.query(checkQuery, [userId, productId], (checkErr, results) => {
        if (checkErr) {
            console.error('Error checking for existing item:', checkErr);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            // If the item exists, update its quantity
            const updateQuery = `UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?`;
            db.query(updateQuery, [quantity, userId, productId], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating cart item:', updateErr);
                    return res.status(500).send('Server error');
                }
                res.status(200).json({ message: 'Cart item quantity updated successfully!' });
            });
        } else {
            // If the item doesn't exist, insert a new one
            const insertQuery = `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)`;
            db.query(insertQuery, [userId, productId, quantity], (insertErr) => {
                if (insertErr) {
                    console.error('Error adding new cart item:', insertErr);
                    return res.status(500).send('Server error');
                }
                res.status(201).json({ message: 'Item added to cart successfully!' });
            });
        }
    });
});

module.exports = router;