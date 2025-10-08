// js/favorites.js

document.addEventListener('DOMContentLoaded', () => {
    const userId = localStorage.getItem('userId');
    const productListContainer = document.getElementById('product-list');
    const loadingMessage = document.getElementById('loading-message');
    
    // --- Initial Check ---
    if (!userId) {
        if (productListContainer) {
            productListContainer.innerHTML = '<p class="message" style="font-size: 2rem; color: var(--green);">Please log in to view your wishlist.</p>';
        }
        return;
    }

    // --- Core Functions ---

    // 1. Fetches the product IDs that the user has favorited
    async function fetchFavoriteProductIds(userId) {
        try {
            const response = await fetch(`http://localhost:3000/favorites/${userId}`);
            if (!response.ok) throw new Error('Failed to fetch favorite IDs');
            // This returns an array of IDs: [1, 5, 8]
            return await response.json(); 
        } catch (error) {
            console.error('Error fetching favorite IDs:', error);
            return [];
        }
    }

    // 2. Fetches the full product data for the given IDs
    async function fetchProductsByIds(productIds) {
        if (productIds.length === 0) return [];
        
        // Assuming you have an API endpoint to fetch products by a list of IDs.
        // If not, this is a placeholder and may require a new backend endpoint.
        // For simplicity, we'll fetch ALL products and filter them client-side for now.
        
        try {
            const response = await fetch('http://localhost:3000/products');
            if (!response.ok) throw new Error('Failed to fetch all products');
            const allProducts = await response.json();
            
            // Filter the full list to only include the favorited IDs
            return allProducts.filter(product => productIds.includes(product.id));

        } catch (error) {
            console.error('Error fetching product details:', error);
            return [];
        }
    }
    
    // 3. Renders the products to the page
    function displayFavoriteProducts(products) {
        if (loadingMessage) {
            loadingMessage.style.display = 'none';
        }

        if (products.length === 0) {
            productListContainer.innerHTML = '<p class="message" style="font-size: 2rem; color: #aaa;">Your wishlist is empty. Start adding some treats!</p>';
            return;
        }

        productListContainer.innerHTML = ''; // Clear the container

        products.forEach(product => {
            const box = document.createElement('div');
            box.className = 'box';
            // Note: We use 'fas' (filled heart) because all products here are favorited.
            // The add-to-cart logic needs to be attached here too.
            box.innerHTML = `
                <span class="discount">-10%</span>
                <div class="icons">
                <a href="#" class="fas fa-heart favorite-icon-btn active-favorite"></a> 
                <a href="#" class="fas fa-share"></a>
                <a href="#" class="fas fa-eye"></a>
                </div>
                <img src="${product.image_url}" alt="${product.name}">
                <h3>${product.name}</h3>
                <div class="stars">
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
                <i class="fas fa-star-half-alt"></i>
                </div>
                <div class="quantify">
                <span>Quantity:</span>
                <input type="number" min="1" max="100" value="1" id="quantity-${product.id}">
                </div>
                <div class="price">
                $${product.price.toFixed(2)}<span> $${(product.price * 1.1).toFixed(2)}</span>
                </div>
                <a href="#" class="btn add-to-cart-btn" data-product-id="${product.id}">Add to cart</a>
                `;
            
            productListContainer.appendChild(box);

            // --- Attach Event Listeners ---
            
            // 1. Favorite Icon Click (to REMOVE from wishlist)
            const favoriteIcon = box.querySelector('.favorite-icon-btn');
            if (favoriteIcon) {
                favoriteIcon.addEventListener('click', (e) => toggleFavorite(e, product.id));
            }

            // 2. Add to Cart Button Click (Preserve your cart logic)
            const addToCartButton = box.querySelector('.add-to-cart-btn');
            if (addToCartButton) {
                addToCartButton.addEventListener('click', (e) => handleAddToCart(e, product.id));
            }
        });
    }

    // 4. Handles Toggling Favorite (Removes from the page on success)
    async function toggleFavorite(event, productId) {
        event.preventDefault(); 

        try {
            const response = await fetch('http://localhost:3000/favorites/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: parseInt(userId),
                    product_id: parseInt(productId)
                })
            });

            if (!response.ok) throw new Error('Failed to toggle favorite status');
            
            const result = await response.json();
            
            // If successfully removed, reload the favorites list
            if (result.favorited === false) {
                alert('Item removed from wishlist!');
                loadFavorites(); // Reload the list to remove the item from display
            }

        } catch (error) {
            console.error('Error toggling favorite:', error);
            alert('Could not update favorites. Server error.');
        }
    }

    // 5. Handles Add to Cart (Preserve your existing logic)
    async function handleAddToCart(event, productId) {
        event.preventDefault();
        
        const quantityInput = document.getElementById(`quantity-${productId}`);
        
        if (!quantityInput) {
            console.error("Quantity input element not found for product:", productId);
            return;
        }

        const quantity = parseInt(quantityInput.value);
        
        try {
            const response = await fetch('http://localhost:3000/cart/add', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, productId: productId, quantity })
            });

            if (response.ok) {
                alert(`🛒 Success! Added to cart.`); 
            } else {
                alert(`❌ Failed to add item to cart.`);
            }
        } catch (error) {
             console.error('Error adding to cart:', error);
             alert(`❌ Failed to add item to cart.`);
        }
    }


    // --- Initialization Function ---
    async function loadFavorites() {
        if (loadingMessage) {
            loadingMessage.style.display = 'block';
        }
        
        // 1. Get the list of favorited IDs
        const favoriteIds = await fetchFavoriteProductIds(userId);
        
        // 2. Get the full details of those products
        const favoriteProducts = await fetchProductsByIds(favoriteIds);
        
        // 3. Display them on the page
        displayFavoriteProducts(favoriteProducts);
    }
    
    // Start the process
    loadFavorites();
});