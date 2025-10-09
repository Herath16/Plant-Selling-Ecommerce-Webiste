const express = require('express');
const router = express.Router();
const db = require('../db');

// Middleware to parse JSON bodies
router.use(express.json());

// GET /orders - Fetch all orders for admin dashboard
router.get('/', (req, res) => {
    // NOTE: In a real application, you should add isAdmin middleware here
    const query = `
        SELECT
            o.id AS order_id,
            o.order_date,
            o.total_amount,
            o.status,
            u.username AS user_name,
            COUNT(oi.product_id) AS total_items
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.order_date DESC;
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ message: 'Error fetching orders from database.' });
        }
        res.json(results);
    });
});

// GET /orders/:id - Fetch details for a specific order
router.get('/:id', (req, res) => {
    const orderId = req.params.id;
    const query = `
        SELECT 
            oi.quantity,
            oi.price_at_purchase,
            p.name AS product_name,
            p.image_url
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        WHERE oi.order_id = ?;
    `;

    db.query(query, [orderId], (err, results) => {
        if (err) {
            console.error('Error fetching order details:', err);
            return res.status(500).json({ message: 'Error fetching order details.' });
        }
        res.json(results);
    });
});

// PUT /orders/:id/status - Update order status (Processing, Shipped, Delivered)
router.put('/:id/status', (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: 'Invalid status provided.' });
    }

    const query = 'UPDATE orders SET status = ? WHERE id = ?';
    db.query(query, [status, orderId], (err, result) => {
        if (err) {
            console.error('Error updating order status:', err);
            return res.status(500).json({ message: 'Error updating order status.' });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json({ message: `Order ${orderId} status updated to ${status}` });
    });
});

module.exports = router;