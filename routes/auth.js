// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcryptjs');

// Register a new user
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
        res.status(200).json({ message: 'Logged in successfully!', userId: user.id });
    });
});

// GET /auth/user/:userId
router.get('/user/:userId', (req, res) => {
    const userId = req.params.userId;

    // Fetch user details from the database
    const query = 'SELECT username, email FROM users WHERE id = ?';
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


module.exports = router;