const express = require('express');
const path = require('path');
const cors = require('cors'); // Use CORS to allow requests from the same origin


const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

app.use(cors());

// Serve static files from the root directory
app.use(express.static(__dirname));

// Route for homepage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for cart page
app.get('/cart', (req, res) => {
   res.sendFile(path.join(__dirname, 'cart.html'));
});

// Route for sign-in page
app.get('/signin', (req, res) => {
    res.sendFile(path.join(__dirname, 'singin.html'));
});

// Modular route: /products
const productsRouter = require('./routes/products');
app.use('/products', productsRouter);

// Modular route: /cart
const cartRouter = require('./routes/cart');
app.use('/cart', cartRouter);

// Modular route for authentication
const authRouter = require('./routes/auth');
app.use('/auth', authRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).send('404: Page not found');
});

// Start server
app.listen(port, () => {
    console.log(`🌱 Server running at http://localhost:${port}`);
});
