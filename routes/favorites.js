// routes/favorites.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json()); 

// 1. API to toggle favorite status (Add or Remove)
router.post('/toggle', (req, res) => {
    const { user_id, product_id } = req.body;

    if (!user_id || !product_id) {
        return res.status(400).json({ message: 'Missing user_id or product_id' });
    }

    // Check if the product is already favorited
    const checkSql = 'SELECT * FROM favorites WHERE user_id = ? AND product_id = ?';
    db.query(checkSql, [user_id, product_id], (err, results) => {
        if (err) {
            console.error('Error checking favorite status:', err);
            return res.status(500).json({ message: 'Server error' });
        }

        if (results.length > 0) {
            // Already favorited, so remove it
            const deleteSql = 'DELETE FROM favorites WHERE user_id = ? AND product_id = ?';
            db.query(deleteSql, [user_id, product_id], (deleteErr) => {
                if (deleteErr) {
                    console.error('Error removing favorite:', deleteErr);
                    return res.status(500).json({ message: 'Server error' });
                }
                res.json({ favorited: false, message: 'Removed from favorites' });
            });
        } else {
            // Not favorited, so add it
            const insertSql = 'INSERT INTO favorites (user_id, product_id) VALUES (?, ?)';
            db.query(insertSql, [user_id, product_id], (insertErr) => {
                if (insertErr) {
                    console.error('Error adding favorite:', insertErr);
                    return res.status(500).json({ message: 'Server error' });
                }
                res.json({ favorited: true, message: 'Added to favorites' });
            });
        }
    });
});

// 2. API to fetch all favorited product IDs for a user
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    const sql = 'SELECT product_id FROM favorites WHERE user_id = ?';
    db.query(sql, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching favorites:', err);
            return res.status(500).json({ message: 'Server error' });
        }
        // Return an array of product IDs
        const favoriteProductIds = results.map(row => row.product_id);
        res.json(favoriteProductIds);
    });
});

module.exports = router;