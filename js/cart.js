// cart.js
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');

    // A hardcoded user ID for demonstration. In a real app, this would come from a user session.
    const userId = 22;

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
                <button class="remove-item-btn" data-product-id="${item.id}"><i class="fas fa-trash"></i></button>`;
            
            cartItemsContainer.appendChild(itemBox);
            total += item.price * item.quantity;
        });

        cartTotalElement.innerText = `$${total.toFixed(2)}`;
    }

    fetchCartData();
});

