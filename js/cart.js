// cart.js
document.addEventListener('DOMContentLoaded', () => {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    const checkoutBtn = document.querySelector('.cart-summary a.btn');
    const addNewAddressBtn = document.getElementById('add-new-address-btn');
    const addressFormContainer = document.getElementById('add-address-form-container');
    const newAddressForm = document.getElementById('new-address-form');
    const cancelAddressBtn = document.getElementById('cancel-address-btn');

    // Get userId from localStorage
    const userId = localStorage.getItem('userId');
    const addressListContainer = document.getElementById('address-list');

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

    async function fetchAddresses() {
        addressListContainer.innerHTML = '<p>Loading addresses...</p>';
        try {
            const response = await fetch(`http://localhost:3000/addresses/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch addresses.');
            
            const addresses = await response.json();
            displayAddresses(addresses);
        } catch (error) {
            console.error("Failed to fetch address data:", error);
            addressListContainer.innerHTML = `<p style="color: red;">Error loading addresses. Please try adding a new one.</p>`;
            checkoutBtn.style.pointerEvents = 'none'; // Disable checkout if no addresses load
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

    function displayAddresses(addresses) {
        addressListContainer.innerHTML = '';
        if (addresses.length === 0) {
            addressListContainer.innerHTML = '<p>No saved addresses. Please add one!</p>';
            checkoutBtn.style.pointerEvents = 'none';
            checkoutBtn.innerText = 'Add Address to Checkout';
            return;
        }
        
        addresses.forEach(address => {
            const isDefault = address.is_default ? ' (Default)' : '';
            const addressHtml = document.createElement('div');
            addressHtml.className = 'address-option';
            addressHtml.innerHTML = `
                <input type="radio" name="shipping_address" id="address-${address.id}" value="${address.id}" ${address.is_default ? 'checked' : ''}>
                <label for="address-${address.id}">
                    ${address.address_line_1}, ${address.city}, ${address.zip_postal_code} ${isDefault}
                </label>
            `;
            addressListContainer.appendChild(addressHtml);
            
            if (address.is_default) {
                selectedAddressId = address.id; // Set default selection
            }
        });
        
        // Ensure the first address is selected if no default is marked
        if (selectedAddressId === null && addresses.length > 0) {
            selectedAddressId = addresses[0].id;
            document.getElementById(`address-${selectedAddressId}`).checked = true;
        }

        // Attach event listener for address selection
        document.querySelectorAll('input[name="shipping_address"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                selectedAddressId = e.target.value;
            });
        });
        
        // Enable checkout button
        if (selectedAddressId !== null) {
            checkoutBtn.style.pointerEvents = 'auto';
            checkoutBtn.innerText = 'Proceed to Checkout';
        }
    }


    // Checkout function
    async function handleCheckout(event) {
        event.preventDefault(); 
        
        if (!selectedAddressId) {
            alert("Please select a shipping address before proceeding.");
            return;
        }

        if (!confirm("Are you sure you want to complete the purchase?")) {
            return;
        }

        // ... (rest of the button disabling logic) ...
        
        try {
            const response = await fetch('http://localhost:3000/cart/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    userId, 
                    shippingAddressId: selectedAddressId // <-- PASS SELECTED ADDRESS ID
                })
            });
            
            // ... (rest of the checkout logic) ...
            const result = await response.json();

            if (response.ok) {
                alert(`🎉 Order #${result.orderId} placed successfully! Total: $${result.total}. Your cart is now empty.`);
                fetchCartData(); // Clear the cart display
            } else {
                alert(`❌ Checkout Failed: ${result.message || 'Server error.'}`);
            }
        } catch (error) {
            // ... (rest of error handling) ...
        } finally {
            // ... (rest of finally block) ...
        }
    }

    // Attach event listener for the checkout button
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleCheckout);
    }

    // Show the form when the 'Add New Address' button is clicked
    if (addNewAddressBtn) {
        addNewAddressBtn.addEventListener('click', (e) => {
            e.preventDefault();
            addressFormContainer.style.display = 'block';
            addressListContainer.style.display = 'none'; // Hide list when adding
            addNewAddressBtn.style.display = 'none'; // Hide add button
        });
    }

    // Hide the form when the 'Cancel' button is clicked
    if (cancelAddressBtn) {
        cancelAddressBtn.addEventListener('click', () => {
            addressFormContainer.style.display = 'none';
            addressListContainer.style.display = 'block'; // Show list
            addNewAddressBtn.style.display = 'block'; // Show add button
            newAddressForm.reset(); // Clear form fields
        });
    }

    // Handle form submission to the POST /addresses route
    if (newAddressForm) {
        newAddressForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Collect form data
            const formData = {
                userId: userId,
                addressLine1: document.getElementById('addressLine1').value,
                addressLine2: document.getElementById('addressLine2').value,
                city: document.getElementById('city').value,
                stateProvince: document.getElementById('stateProvince').value,
                zipCode: document.getElementById('zipCode').value,
                country: document.getElementById('country').value || 'United States',
                isDefault: document.getElementById('isDefault').checked
            };

            try {
                const response = await fetch('http://localhost:3000/addresses', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    alert('Address added successfully!');
                    newAddressForm.reset();
                    addressFormContainer.style.display = 'none'; // Hide form
                    addressListContainer.style.display = 'block'; // Show list
                    addNewAddressBtn.style.display = 'block'; // Show add button
                    
                    // Re-fetch and display addresses, which will update the radio buttons
                    fetchAddresses(); 
                } else {
                    alert(`Failed to add address: ${result.message || 'Server error.'}`);
                }

            } catch (error) {
                console.error('Error adding new address:', error);
                alert('An unexpected error occurred while saving the address.');
            }
        });
    }


    fetchCartData(); // Initial fetch to load the cart
    fetchAddresses();
});