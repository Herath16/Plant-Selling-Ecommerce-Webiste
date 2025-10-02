// cart.js
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');

    // Get userId from localStorage
    const userId = localStorage.getItem('userId');

    // Redirect to signin if not logged in
    if (!userId) {
        alert('Please sign in to add items to your cart.');
        window.location.href = 'signin.html';
        return;
    }

    async function fetchCartData() {
        try {
            const response = await fetch(`http://localhost:3000/cart/${userId}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const cartItems = await response.json();
            displayCartItems(cartItems);
        } catch (error) {
            console.error("Failed to fetch cart data:", error);
            cartItemsContainer.innerHTML = `<p>Error loading cart. Please try again.</p>`;
        }
    }

    function displayCartItems(items) {
        cartItemsContainer.innerHTML = ''; // Clear existing items
        let total = 0;

        if (items.length === 0) {
            cartItemsContainer.innerHTML = `<p>Your cart is empty.</p>`;
            return;
        }

        items.forEach(item => {
            const itemBox = document.createElement('div');
            itemBox.className = 'cart-item-box';
            itemBox.innerHTML = `
                <img src="${item.image_url}" alt="${item.name}">
                <div class="item-details">
                    <h3>${item.name}</h3>
                    <p>Price: $${item.price.toFixed(2)}</p>
                    <div class="item-quantity">
                        <label for="quantity-${item.id}">Quantity:</label>
                        <input type="number" id="quantity-${item.id}" value="${item.quantity}" min="1">
                    </div>
                </div>
                <button class="remove-item-btn" style="border: solid black 2px; width:100px; height: 40px" data-product-id="${item.id}"><i class="fas fa-trash"></i></button>`;
            
            cartItemsContainer.appendChild(itemBox);
            total += item.price * item.quantity;
        });

        cartTotalElement.innerText = `$${total.toFixed(2)}`;

        // This is the CRITICAL change: Add event listeners after elements are created
        const removeButtons = document.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                // Find the closest parent button that has the data-product-id attribute
                const buttonElement = event.target.closest('.remove-item-btn');
                const productId = buttonElement.dataset.productId;
                //const userId = 11;

                try {
                    const response = await fetch('http://localhost:3000/cart/remove', {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ userId, productId })
                    });

                    const result = await response.json();
                    
                    if (response.ok) {
                        fetchCartData(); // Re-fetch data to update the cart display
                    } else {
                        throw new Error(result.message || 'Failed to remove item.');
                    }
                } catch (error) {
                    console.error("Failed to remove item:", error);
                    alert(`Error: ${error.message}`);
                }
            });
        });
    }

    fetchCartData(); // Initial fetch to load the cart
});