const express = require('express');
const router = express.Router();
const db = require('../db');

router.use(express.json());

// Helper function to reset default status for a user
const resetDefaultAddress = (userId, connection, callback) => {
    const query = 'UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?';
    connection.query(query, [userId], callback);
};

// GET /addresses/:userId - Get all addresses for a user
router.get('/:userId', (req, res) => {
    const userId = req.params.userId;
    const query = 'SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, id DESC';
    
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching addresses:', err);
            return res.status(500).json({ message: 'Error fetching addresses.' });
        }
        res.json(results);
    });
});

// POST /addresses - Add a new address
router.post('/', (req, res) => {
    const { userId, addressLine1, addressLine2, city, stateProvince, zipCode, country, isDefault } = req.body;

    if (!userId || !addressLine1 || !city || !zipCode) {
        return res.status(400).json({ message: 'Missing required address fields.' });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: 'Transaction error.' });

        // Step 1: If new address is set as default, reset all others
        if (isDefault) {
            resetDefaultAddress(userId, db, (err) => {
                if (err) return db.rollback(() => res.status(500).json({ message: 'Error resetting default address.' }));

                // Step 2: Insert the new address
                const insertQuery = `
                    INSERT INTO user_addresses (user_id, address_line_1, address_line_2, city, state_province, zip_postal_code, country, is_default)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const values = [userId, addressLine1, addressLine2, city, stateProvince, zipCode, country, isDefault];
                
                db.query(insertQuery, values, (err, result) => {
                    if (err) return db.rollback(() => res.status(500).json({ message: 'Error inserting new address.' }));
                    
                    db.commit(err => {
                        if (err) return db.rollback(() => res.status(500).json({ message: 'Transaction commit error.' }));
                        res.status(201).json({ message: 'Address added successfully!', id: result.insertId });
                    });
                });
            });
        } else {
            // If not setting as default, just insert the new address
            const insertQuery = `
                INSERT INTO user_addresses (user_id, address_line_1, address_line_2, city, state_province, zip_postal_code, country, is_default)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `;
            const values = [userId, addressLine1, addressLine2, city, stateProvince, zipCode, country, isDefault];
            
            db.query(insertQuery, values, (err, result) => {
                if (err) return db.rollback(() => res.status(500).json({ message: 'Error inserting new address.' }));
                
                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ message: 'Transaction commit error.' }));
                    res.status(201).json({ message: 'Address added successfully!', id: result.insertId });
                });
            });
        }
    });
});

// PUT /addresses/:id/default - Set an existing address as default
router.put('/:id/default', (req, res) => {
    const addressId = req.params.id;
    const userId = req.body.userId; // Must pass userId in body for security/logic

    if (!userId) {
        return res.status(400).json({ message: 'User ID is required.' });
    }

    db.beginTransaction(err => {
        if (err) return res.status(500).json({ message: 'Transaction error.' });

        // Step 1: Reset all default statuses for the user
        resetDefaultAddress(userId, db, (err) => {
            if (err) return db.rollback(() => res.status(500).json({ message: 'Error resetting default address.' }));

            // Step 2: Set the specified address as default
            const updateQuery = 'UPDATE user_addresses SET is_default = TRUE WHERE id = ? AND user_id = ?';
            
            db.query(updateQuery, [addressId, userId], (err, result) => {
                if (err) return db.rollback(() => res.status(500).json({ message: 'Error setting new default address.' }));
                if (result.affectedRows === 0) return db.rollback(() => res.status(404).json({ message: 'Address not found for this user.' }));

                db.commit(err => {
                    if (err) return db.rollback(() => res.status(500).json({ message: 'Transaction commit error.' }));
                    res.json({ message: 'Address set as default successfully.' });
                });
            });
        });
    });
});

module.exports = router;