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

// POST /cart/add - MODIFIED TO INCLUDE STOCK CHECK AND REDUCTION
router.post('/add', (req, res) => {
    const { userId, productId, quantity } = req.body;
    const itemQuantity = parseInt(quantity); // The amount to add to cart

    // Check for required data
    if (!userId || !productId || !quantity || itemQuantity <= 0) {
        return res.status(400).json({ message: 'User ID, Product ID, and a valid positive quantity are required.' });
    }

    // 1. Check current stock before performing any cart action
    db.query('SELECT stock_quantity FROM products WHERE id = ?', [productId], (stockErr, stockResults) => {
        if (stockErr) {
            console.error('Error checking stock:', stockErr);
            return res.status(500).send('Server error during stock check.');
        }

        if (stockResults.length === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        const currentStock = stockResults[0].stock_quantity;

        // Check if the requested quantity exceeds available stock
        if (currentStock < itemQuantity) {
            return res.status(400).json({ message: `Insufficient stock. Only ${currentStock} available.` });
        }

        // Helper function to reduce stock after the cart operation is successful
        const updateStockAndRespond = (status, cartMessage) => {
            const stockUpdateQuery = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?';
            db.query(stockUpdateQuery, [itemQuantity, productId], (stockUpdateErr) => {
                if (stockUpdateErr) {
                    console.error('Error reducing stock:', stockUpdateErr);
                    // IMPORTANT: Without full transactions, there's a small risk of cart updating 
                    // but stock failing. Alerting the developer/admin is crucial.
                    return res.status(500).json({ message: 'Cart updated, but stock reduction failed. Inventory may be inaccurate.' });
                }
                // Both cart and stock updates succeeded
                res.status(status).json({ message: `${cartMessage} Stock successfully reduced.` });
            });
        };
        
        // 2. Stock is sufficient, proceed with Cart logic
        const checkQuery = `SELECT * FROM cart_items WHERE user_id = ? AND product_id = ?`;
        db.query(checkQuery, [userId, productId], (checkErr, results) => {
            if (checkErr) {
                console.error('Error checking for existing item:', checkErr);
                return res.status(500).send('Server error');
            }

            if (results.length > 0) {
                // If the item exists, update its quantity
                const updateQuery = `UPDATE cart_items SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?`;
                db.query(updateQuery, [itemQuantity, userId, productId], (updateErr) => {
                    if (updateErr) {
                        console.error('Error updating cart item:', updateErr);
                        return res.status(500).send('Server error');
                    }
                    // 3. Reduce stock and respond
                    updateStockAndRespond(200, 'Cart item quantity updated.');
                });
            } else {
                // If the item doesn't exist, insert a new one
                const insertQuery = `INSERT INTO cart_items (user_id, product_id, quantity) VALUES (?, ?, ?)`;
                db.query(insertQuery, [userId, productId, itemQuantity], (insertErr) => {
                    if (insertErr) {
                        console.error('Error adding new cart item:', insertErr);
                        return res.status(500).send('Server error');
                    }
                    // 3. Reduce stock and respond
                    updateStockAndRespond(201, 'Item added to cart.');
                });
            }
        });
    });
});

router.delete('/remove', (req, res) => {
    const { userId, productId } = req.body;

    if (!userId || !productId) {
        return res.status(400).json({ message: 'User ID and Product ID are required.' });
    }

    // 1. Get the quantity of the item being deleted from the cart
    const getQuantityQuery = `SELECT quantity FROM cart_items WHERE user_id = ? AND product_id = ?`;

    db.query(getQuantityQuery, [userId, productId], (quantityErr, quantityResults) => {
        if (quantityErr) {
            console.error('Error fetching cart item quantity:', quantityErr);
            return res.status(500).send('Server error');
        }

        if (quantityResults.length === 0) {
            return res.status(404).json({ message: 'Item not found in cart.' });
        }
        
        const removedQuantity = quantityResults[0].quantity;

        // 2. Delete the item from the cart
        const deleteQuery = `DELETE FROM cart_items WHERE user_id = ? AND product_id = ?`;
        
        db.query(deleteQuery, [userId, productId], (deleteErr, deleteResult) => {
            if (deleteErr) {
                console.error('Error removing item from cart:', deleteErr);
                return res.status(500).send('Server error during cart removal');
            }
            
            // 3. Restore the stock quantity
            const restoreStockQuery = 'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?';
            
            db.query(restoreStockQuery, [removedQuantity, productId], (restoreErr, restoreResult) => {
                if (restoreErr) {
                    console.error('Error restoring stock:', restoreErr);
                    // CRITICAL: Stock restoration failed, but item is out of cart. Log this error!
                    return res.status(500).json({ message: 'Item removed from cart, but stock restoration failed. Inventory may be inaccurate.' });
                }

                res.status(200).json({ message: 'Item removed from cart!' });
            });
        });
    });
});


module.exports = router;