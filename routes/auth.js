// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// Register a new user
/*
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    // Validate input
    if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert the new user into the database
        const query = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
        db.query(query, [username, email, hashedPassword], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ message: 'Username or email already exists.' });
                }
                console.error('Error registering user:', err);
                return res.status(500).send('Server error');
            }
            res.status(201).json({ message: 'User registered successfully!', userId: result.insertId });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).send('Server error');
    }
});
*/

router.post('/signup', async (req, res) => { // CRITICAL: Use 'async' here
    // Destructure data sent from the frontend
    const { username, email, password } = req.body;

    // 1. Validate input (Good practice)
    if (!username || !email || !password) {
        // Return 400 if any required field is missing
        return res.status(400).json({ success: false, message: 'All fields (username, email, password) are required.' });
    }

    try {
        // 2. Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password with a cost factor of 10

        // 3. Insert the new user into the database
        // NOTE: Ensure your users table has the 'role' column.
        const query = 'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)';
        
        // Use the HASHED password in the values array
        db.query(query, [username, email, hashedPassword, 'user'], (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY' || err.errno === 1062) {
                    // This handles unique constraint errors (e.g., if username or email is a duplicate)
                    return res.status(409).json({ success: false, message: 'Username or email already exists. Please choose another.' });
                }
                console.error('Database Error during signup:', err);
                return res.status(500).json({ success: false, message: 'Server failed to create user.' });
            }

            // Success response
            res.status(201).json({ 
                success: true, 
                message: 'User created successfully! Proceed to sign-in.',
                userId: result.insertId
            });
        });
    } catch (error) {
        console.error('Error during signup process (hashing or database query):', error);
        res.status(500).json({ success: false, message: 'Internal server error during user creation.' });
    }
});


// Login a user
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    // Find the user by email
    const query = 'SELECT * FROM users WHERE email = ?';
    db.query(query, [email], async (err, results) => {
        if (err) {
            console.error('Error logging in:', err);
            return res.status(500).send('Server error');
        }
        if (results.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = results[0];
        // Compare the provided password with the hashed password in the database
        const isMatch = await bcrypt.compare(password, user.password);

        console.log('Password entered:', password);
        console.log('Stored hashed password:', user.password);
        console.log('Password comparison result:', isMatch); // This will show true or false

        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Authentication successful
        res.status(200).json({ message: 'Logged in successfully!', userId: user.id, userRole: user.role });
    });
});

// GET /auth/user/:userId
router.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;

    // Fetch user details from the database
    const query = 'SELECT username, email, role FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err) {
            console.error('Error fetching user details:', err);
            return res.status(500).send('Server error');
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        // Send back the user details (excluding the password)
        res.status(200).json({ user: results[0] });
    });
});


// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
    const userId = req.body.userId || req.params.userId; // Get user ID from body or params

    if (!userId) {
        return res.status(401).json({ message: 'Authentication failed. No user ID provided.' });
    }

    const query = 'SELECT role FROM users WHERE id = ?';
    db.query(query, [userId], (err, results) => {
        if (err || results.length === 0) {
            console.error('Error fetching user role:', err);
            return res.status(401).json({ message: 'Authentication failed. User not found.' });
        }

        const userRole = results[0].role;
        if (userRole === 'admin') {
            next(); // User is an admin, proceed to the next handler
        } else {
            res.status(403).json({ message: 'Access denied. Administrator privileges required.' });
        }
    });
};

module.exports = {
    router,
    isAdmin
};