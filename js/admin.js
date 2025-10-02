// js/admin.js
document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');

    // First, verify if the user is an admin
    if (!userId) {
        alert('You must be logged in to view this page.');
        window.location.href = 'signin.html';
        return;
    }

    // --- Product Management Functions ---

    const addProductForm = document.getElementById('add-product-form');
    const productListBody = document.getElementById('product-list-body');


    try {
        const checkAdminResponse = await fetch(`http://localhost:3000/auth/user/${userId}`);
        const userResult = await checkAdminResponse.json();

        if (checkAdminResponse.ok && userResult.user.role === 'admin') {
            // User is an admin, proceed to load the content
            await fetchAndDisplayProducts();
        } else {
            alert('Access denied. You do not have administrator privileges.');
            window.location.href = 'index.html';
        }
    } catch (error) {
        console.error('Error verifying user role:', error);
        alert('An error occurred. Please try again.');
        window.location.href = 'index.html';
    }

    
    async function fetchAndDisplayProducts() {
        try {
            const response = await fetch('http://localhost:3000/products');
            const products = await response.json();
            productListBody.innerHTML = '';
            products.forEach(product => {
                const row = `
                    <tr>
                        <td>${product.id}</td>
                        <td>${product.name}</td>
                        <td>$${product.price.toFixed(2)}</td>
                        <td>${product.stock_quantity}</td>
                        <td>
                            <button class="increase-stock-btn" data-id="${product.id}">+ Stock</button> 
                            <button class="edit-btn" data-id="${product.id}">Edit</button>
                            <button class="delete-btn" data-id="${product.id}">Delete</button>
                        </td>
                    </tr>
                `;
                productListBody.innerHTML += row;
            });
            attachEventListeners();
        } catch (error) {
            console.error('Error fetching products:', error);
            alert('Failed to load products.');
        }
    }

    // FIX APPLIED HERE: Added event listener for '.increase-stock-btn'
    function attachEventListeners() {
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.id;
                if (confirm(`Are you sure you want to delete product ID ${productId}?`)) {
                    await deleteProduct(productId);
                }
            });
        });
        
        // NEW: Attach listener for the increase stock buttons
        document.querySelectorAll('.increase-stock-btn').forEach(button => {
            button.addEventListener('click', async (event) => {
                const productId = event.target.dataset.id;
                await increaseProductStock(productId);
            });
        });
    }

    async function addProduct(productData) {
        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch('http://localhost:3000/products/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ ...productData, userId })
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                addProductForm.reset();
                fetchAndDisplayProducts(); // Refresh the list
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error adding product:', error);
            alert(`Error: ${error.message}`);
        }
    }

    async function deleteProduct(productId) {
        const userId = localStorage.getItem('userId');
        try {
            const response = await fetch(`http://localhost:3000/products/delete/${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ userId }) // Send userId for authentication
            });
            const result = await response.json();
            if (response.ok) {
                alert(result.message);
                fetchAndDisplayProducts(); // Refresh the list
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Error deleting product:', error);
            alert(`Error: ${error.message}`);
        }
    }

    async function increaseProductStock(productId) {
    // Prompt admin for the quantity to add
    const amountToAdd = prompt("Enter the quantity to add to stock:");

    if (amountToAdd === null || isNaN(parseInt(amountToAdd)) || parseInt(amountToAdd) <= 0) {
        if (amountToAdd !== null) {
            alert('Please enter a valid positive number.');
        }
        return;
    }

    const userId = localStorage.getItem('userId');
    const increaseData = { 
        userId: userId,
        increaseAmount: parseInt(amountToAdd)
    };

    try {
        const response = await fetch(`http://localhost:3000/products/increase-stock/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(increaseData)
        });
        const result = await response.json();

        if (response.ok) {
            alert(result.message);
            fetchAndDisplayProducts(); // Refresh the product list
        } else {
            throw new Error(result.message || 'Failed to increase stock.');
        }
    } catch (error) {
        console.error('Error increasing stock:', error);
        alert(`Error: ${error.message}`);
    }
}

    // Event listener for the "Add Product" form
    addProductForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const productData = {
            name: document.getElementById('name').value,
            price: parseFloat(document.getElementById('price').value),
            stock_quantity: parseInt(document.getElementById('stock_quantity').value),
            image_url: document.getElementById('image_url').value,
            // You are missing the 'category' field here, you should add it back to the form data
            // category: document.getElementById('category').value 
        };
        addProduct(productData);
    });

    
});