// cart.js
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    // Get the checkout link/button from the HTML
    const checkoutBtn = document.querySelector('.cart-summary a.btn');

    // Get userId from localStorage
    const userId = localStorage.getItem('userId');

    // Redirect to signin if not logged in
    if (!userId) {
        alert('Please sign in to view and purchase items.');
        window.location.href = 'singin.html';
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
            // Disable checkout button if cart is empty
            if (checkoutBtn) {
                checkoutBtn.style.pointerEvents = 'none';
                checkoutBtn.style.opacity = '0.5';
            }
            cartTotalElement.innerText = `$0.00`;
            return;
        }

        // Enable checkout button if cart has items
        if (checkoutBtn) {
            checkoutBtn.style.pointerEvents = 'auto';
            checkoutBtn.style.opacity = '1';
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
                        <label for="quantity-${item.id}">Quantity: ${item.quantity}</label>
                    </div>
                </div>
                <button class="remove-item-btn" style="border: solid black 2px; width:100px; height: 40px" data-product-id="${item.id}"><i class="fas fa-trash"></i></button>`;

            cartItemsContainer.appendChild(itemBox);
            total += item.price * item.quantity;
        });

        cartTotalElement.innerText = `$${total.toFixed(2)}`;

        // Attach event listeners after elements are created
        const removeButtons = document.querySelectorAll('.remove-item-btn');
        removeButtons.forEach(button => {
            button.addEventListener('click', async (event) => {
                // Find the closest parent button that has the data-product-id attribute
                const buttonElement = event.target.closest('.remove-item-btn');
                const productId = buttonElement.dataset.productId;

                try {
                    const response = await fetch('http://localhost:3000/cart/remove', {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
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

    // Checkout function
    async function handleCheckout(event) {
        event.preventDefault(); // Prevent default link navigation

        if (!confirm("Are you sure you want to complete the purchase?")) {
            return;
        }

        // Temporarily disable the button
        if (checkoutBtn) {
            checkoutBtn.style.pointerEvents = 'none';
            checkoutBtn.innerText = 'Processing...';
        }

        try {
            const response = await fetch('http://localhost:3000/cart/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            });

            const result = await response.json();

            if (response.ok) {
                alert(`🎉 Order #${result.orderId} placed successfully! Total: $${result.total}. Your cart is now empty.`);
                fetchCartData(); // Clear the display
            } else {
                alert(`❌ Checkout Failed: ${result.message || 'Server error.'}`);
            }
        } catch (error) {
            console.error("Checkout failed:", error);
            alert('An unexpected error occurred during checkout.');
        } finally {
            // Restore button state (fetchCartData handles re-enabling if items exist)
            if (checkoutBtn) {
                checkoutBtn.innerText = 'Proceed to Checkout';
                checkoutBtn.style.pointerEvents = 'auto';
            }
        }
    }

    // Attach event listener for the checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    fetchCartData(); // Initial fetch to load the cart
});