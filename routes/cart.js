
const express = require('express');
const router = express.Router();
const db = require('../db'); // Correctly imports the single database connection

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

module.exports = router;