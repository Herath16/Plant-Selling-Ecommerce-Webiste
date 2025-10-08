// js/products.js

// Ensure necessary variables are available (or make these functions global in script.js)
// For now, we will redefine the necessary helper functions from script.js here:
const currentUserId = localStorage.getItem('userId');
let userFavorites = []; 
const userlogin = document.querySelector('.login-form-container'); 

document.addEventListener('DOMContentLoaded', () => {
    // 1. Get the container for products
    const container = document.getElementById('product-list-page');
    if (!container) return; 

    // 2. Fetch all products and display them
    fetchProductsAndFavorites(); 

    // 3. Attach search listener (using logic from the previous answer)
    const searchForm = document.querySelector('.serach-bar-container');
    const searchInput = document.getElementById('search-bar');
    if (searchForm) {
        searchForm.addEventListener('submit', (event) => {
            event.preventDefault(); 
            const query = searchInput.value.trim();
            fetchProductsAndFavorites(query); 
        });
    }

});

// =========================================================================
// CORE FUNCTIONS (Copied/Adapted from your combined script.js logic)
// =========================================================================

// Function to fetch the user's current favorites
async function fetchUserFavorites(userId) {
    if (!userId) return [];
    try {
        const response = await fetch(`http://localhost:3000/favorites/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch favorites');
        return await response.json().then(ids => ids.map(id => parseInt(id)));
    } catch (error) {
        console.error('Error fetching user favorites:', error);
        return [];
    }
}

// Function to handle the favorite icon click (Add or Remove)
async function toggleFavorite(event) {
    event.preventDefault(); 

    const userId = localStorage.getItem('userId');
    if (!userId) {
        alert('Please log in to add items to your favorites.');
        if (userlogin) userlogin.classList.add('active'); 
        return;
    }
    
    const favoriteIcon = event.currentTarget;
    const productBox = favoriteIcon.closest('.box');
    const productId = productBox.dataset.productId; 

    if (!productId) return;

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
        
        // Update the icon class and local list
        if (result.favorited) {
            favoriteIcon.classList.remove('far'); 
            favoriteIcon.classList.add('fas'); 
            if (!userFavorites.includes(parseInt(productId))) {
                userFavorites.push(parseInt(productId));
            }
        } else {
            favoriteIcon.classList.remove('fas'); 
            favoriteIcon.classList.add('far'); 
            userFavorites = userFavorites.filter(id => id !== parseInt(productId));
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Could not update favorites. Server error.');
    }
}

// The main function to load all products and the user's favorites
async function fetchProductsAndFavorites(searchQuery = null) {
    const userId = localStorage.getItem('userId');
    const container = document.getElementById('product-list-page');
    let endpoint = 'http://localhost:3000/products';

    if (searchQuery) {
        endpoint += `?query=${encodeURIComponent(searchQuery)}`;
    }
    
    // 1. Fetch favorites only if a user is logged in
    if (userId) {
        userFavorites = await fetchUserFavorites(userId);
    }
    
    // 2. Fetch all products (or filtered products)
    try {
        const response = await fetch(endpoint); 
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const products = await response.json();
        
        if (container) {
            if (products.length === 0) {
                 container.innerHTML = `<p class="message" style="font-size: 2rem; color: #aaa;">No products found for "${searchQuery}".</p>`;
            } else {
                displayProducts(products, container); // Pass the correct container
            }
        }

    } catch (error) {
        console.error('Failed to fetch products:', error);
        if(container) container.innerHTML = `<p class="message" style="font-size: 2rem; color: red;">Error loading products.</p>`;
    }
}


// Function to display products, including favorite status and event listeners
function displayProducts(products, container) {
    container.innerHTML = ''; // Clear existing content

    products.forEach(product => {
        const box = document.createElement('div');
        box.className = 'box';
        box.dataset.productId = product.id;
        
        const isFavorited = userFavorites.includes(product.id);
        const heartClass = isFavorited ? 'fas' : 'far';
        
        box.innerHTML = `
            <span class="discount">-10%</span>
            <div class="icons">
            <a href="#" class="${heartClass} fa-heart favorite-icon-btn"></a> 
            <a href="#" class="fas fa-share"></a>
            <a href="product-details.html?id=${product.id}" class="fas fa-eye"></a>
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
        
        container.appendChild(box);
        
        // --- Attach FAVORITE click listener ---
        const favoriteIcon = box.querySelector('.favorite-icon-btn');
        if (favoriteIcon) {
            favoriteIcon.addEventListener('click', toggleFavorite);
        }

        // --- Attach CART click listener (Reusing original logic) ---
        const addToCartButton = box.querySelector('.add-to-cart-btn');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', async (event) => {
                event.preventDefault();
                const productId = event.target.dataset.productId;
                const quantityInput = document.getElementById(`quantity-${productId}`);
                
                if (!quantityInput) {
                    console.error("Quantity input element not found for product:", productId);
                    return;
                }

                const quantity = parseInt(quantityInput.value);
                const userId = localStorage.getItem('userId');

                if (!userId) {
                    alert('Please sign in to add items to your cart.');
                    window.location.href = 'signin.html';
                    return;
                }
                
                const response = await fetch('http://localhost:3000/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, productId, quantity })
                });

                const result = await response.json();

                if (response.ok) {
                    alert(`🛒 Success!`); 
                } else {
                    alert(`❌ Failed to add item`);
                }
                console.log(result.message);
            });
        }
        
        // --- Attach BOX click listener for product details redirect ---
        box.addEventListener('click', (event) => {
            // Check if the click target is NOT an interactive element (cart, favorite, share)
            if (!event.target.closest('.btn') && !event.target.closest('.icons a')) {
                window.location.href = `product-details.html?id=${product.id}`;
            }
        });
    });
}