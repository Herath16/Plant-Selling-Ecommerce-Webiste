// script.js
// Place these at the top of your script (Preserved Existing Variables)
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const cartIcon = document.querySelector('.fas.fa-shopping-cart');
const barmenu = document.querySelector('.nav-bar');
const navbars = document.querySelector('#menu-bar');
const header3 = document.querySelector('.header-3');
const scrollTop = document.querySelector('.scroll-top');
const userlogin = document.querySelector('.login-form-container');
const cart = document.querySelector('.cart-items-container');

// NEW: Variables for Favorites
const currentUserId = localStorage.getItem('userId');
let userFavorites = []; 

// =========================================================================
// FAVORITES LOGIC (NEW FUNCTIONS)
// =========================================================================

// Function to fetch the user's current favorites
async function fetchUserFavorites(userId) {
    if (!userId) return [];
    try {
        const response = await fetch(`http://localhost:3000/favorites/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch favorites');
        // Returns an array of product IDs: [1, 5, 8]
        const favoriteIds = await response.json(); 
        // Ensure IDs are numbers for correct comparison later
        return favoriteIds.map(id => parseInt(id)); 
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
        userlogin.classList.add('active'); 
        return;
    }
    
    const favoriteIcon = event.currentTarget;
    // Get the product ID from the parent 'box' element
    const productBox = favoriteIcon.closest('.box');
    const productId = productBox.dataset.productId; 

    if (!productId) {
        console.error('Product ID not found.');
        return;
    }

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
        
        // Update the icon class and local list based on the backend response
        if (result.favorited) {
            favoriteIcon.classList.remove('far'); // Empty heart
            favoriteIcon.classList.add('fas'); // Filled heart
            // Add to the local list (if not already there)
            if (!userFavorites.includes(parseInt(productId))) {
                userFavorites.push(parseInt(productId));
            }
        } else {
            favoriteIcon.classList.remove('fas'); 
            favoriteIcon.classList.add('far'); 
            // Remove from the local list
            userFavorites = userFavorites.filter(id => id !== parseInt(productId));
        }

    } catch (error) {
        console.error('Error toggling favorite:', error);
        alert('Could not update favorites. Server error.');
    }
}

// Function to load all products and the user's favorites
// The main function to load all products and the user's favorites
async function fetchProducts(searchQuery = null) {
    const userId = localStorage.getItem('userId');
    const isHomePage = document.getElementById('Featured-Product'); // Check for the homepage section ID
    
    let endpoint = 'http://localhost:3000/products';

    // 1. Construct the API endpoint with the search query if one exists
    if (searchQuery) {
        endpoint += `?query=${encodeURIComponent(searchQuery)}`;
    }

    // 2. Fetch favorites only if a user is logged in (EXISTING FAVORITES LOGIC)
    if (userId) {
        userFavorites = await fetchUserFavorites(userId);
    }
    
    // 3. Fetch all products (or filtered products)
    try {
        const response = await fetch(endpoint); 
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        let products = await response.json();
        
        // --- NEW LIMITING LOGIC ---
        // If we are on the homepage AND not performing a search, limit to 5 products
        if (isHomePage && !searchQuery) {
             products = products.slice(0, 5); // Take only the first 5 elements
        }

        displayProducts(products); 

    } catch (error) {
        console.error('Failed to fetch products:', error);
    }
}

// Function to display products, including favorite status and event listeners
function displayProducts(products) {
    const container = document.getElementById('product-list');
    if (!container) return; 
    container.innerHTML = ''; 

    products.forEach(product => {
        const box = document.createElement('div');
        box.className = 'box';
        // CRITICAL: Store product ID on the box element for both favorites and cart
        box.dataset.productId = product.id;
        
        // Determine the initial state of the heart icon
        // userFavorites contains product IDs as numbers, so compare with the numeric ID
        const isFavorited = userFavorites.includes(product.id);
        // 'far' (font-awesome-regular) is for an empty heart, 'fas' (font-awesome-solid) is for a filled heart
        const heartClass = isFavorited ? 'fas' : 'far';
        
        box.innerHTML = `
            <span class="discount">-10%</span>
            <div class="icons">
            <a href="#" class="${heartClass} fa-heart favorite-icon-btn"></a> 
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
        
        container.appendChild(box);
        
        // --- Attach FAVORITE click listener ---
        const favoriteIcon = box.querySelector('.favorite-icon-btn');
        if (favoriteIcon) {
            favoriteIcon.addEventListener('click', toggleFavorite);
        }

        // --- Attach CART click listener (Preserved Original Logic) ---
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
    });
    const more = document.createElement('div');
        more.className = 'box';
    more.innerHTML=`
            <div class="box view-all-box" style="text-align: center; flex: 0 0 30rem; margin: 0 1rem; cursor: pointer;">
                
                <div style="height: 30rem; display: flex; align-items: center; justify-content: center; border-bottom: .05rem solid gray; background: #f9f9f9;">
                    <i class="fas fa-list-alt" style="font-size: 8rem; color: var(--green);"></i>
                </div>

                <div class="icons" style="top: 0; left: 0; background: none; box-shadow: none;">
                    <a href="products.html" class="fas fa-search" style="height: 4.5rem; width: 4.5rem; line-height: 4.5rem; background: rgba(0, 255, 0, 0.1);"></a>
                </div>
                
                <h3>Explore Full Catalog</h3>
                <div class="stars">
                    <i class="fas fa-star" style="color: transparent;"></i> 
                    <i class="fas fa-star" style="color: transparent;"></i> 
                    </div>
                
                <div class="quantify" style="padding: 1rem 0;">
                    <span style="font-size: 1.6rem; color: #666;">Hundreds of Varieties!</span>
                </div>
                
                <div class="price" style="font-size: 2rem; color: #666;">
                    View <span>All</span>
                </div>
                
                <a href="products.html" class="btn" style="display: block; margin: 2rem;">View All Products</a>
            </div>
    `
    container.appendChild(more);
}



// =========================================================================
// EXISTING LOGIC (Preserved)
// =========================================================================

// Function to handle displaying the logged-in user and buttons
async function displayLoggedInUser() {
    const userId = localStorage.getItem('userId');
    const userInfoDiv = document.getElementById('user-info');
    
    if (loginBtn && logoutBtn) {
        if (userId) {
            loginBtn.style.display = 'none';
            logoutBtn.style.display = 'block';

            try {
                const response = await fetch(`http://localhost:3000/auth/user/${userId}`);
                const result = await response.json();

                if (response.ok && result.user) {
                    userInfoDiv.innerHTML = `<span>Hello, ${result.user.username}!</span>`;
                    if (cartIcon && result.user.role === 'admin') {
                        cartIcon.href = 'admin.html';
                    } else if (cartIcon) {
                        cartIcon.href = 'cart.html'; 
                    }

                } else {
                    userInfoDiv.innerHTML = '<span>Guest</span>';
                }
            } catch (error) {
                console.error('Error fetching user info:', error);
                userInfoDiv.innerHTML = '<span>Guest</span>';
            }
        } else {
            // User is not logged in
            loginBtn.style.display = 'block';
            logoutBtn.style.display = 'none';
            userInfoDiv.innerHTML = '<span>Guest</span>';
            if (cartIcon) {
                cartIcon.href = 'cart.html'; 
            }
        }
    }
}

// Add the logout event listener
if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
        event.preventDefault(); 
        localStorage.removeItem('userId'); 
        window.location.reload(); 
    });
}

// Call the function to set the initial state when the page loads
displayLoggedInUser();


// Only add event listeners to elements that exist in the HTML
if (navbars) {
    navbars.onclick = () => {
        navbars.classList.toggle('fa-times');
        barmenu.classList.toggle('active');
    }
}

// Check for the user login elements before adding the event listener
if (document.querySelector('#login-btn')) {
    document.querySelector('#login-btn').onclick = () => {
        userlogin.classList.toggle('active');
        navbars.classList.remove('fa-times');
        barmenu.classList.remove('active');
    }
}

// Make sure the close button exists before trying to access it
if (document.querySelector('#close-login-btn')) {
    document.querySelector('#close-login-btn').onclick = () => {
        userlogin.classList.remove('active');
    }
}

if (document.querySelector('#cart-btn')) {
    document.querySelector('#cart-btn').onclick = () => {
        cart.classList.toggle('active');
        navbars.classList.remove('fa-times');
        barmenu.classList.remove('active');
    }
}

window.onscroll = () => {
    navbars.classList.remove('fa-times');
    barmenu.classList.remove('active');

    if (window.scrollY > 250) {
        header3.classList.add('active');
        scrollTop.style.display = 'initial';
    } else {
        header3.classList.remove('active');
        scrollTop.style.display = 'none';
    }
}

window.onload = () => {
    navbars.classList.remove('fa-times');
    barmenu.classList.remove('active');
}

let swiper = new Swiper(".home-slider", {
    autoplay: {
        delay: 3000,
        disableOnInteraction: false,
    },
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    loop: true,
});

let countDate = new Date('May 1, 2026 00:00:00').getTime();

function countDown() {
    let now = new Date().getTime();
    gap = countDate - now;

    let second = 1000;
    let minute = second * 60;
    let hour = minute * 60;
    let day = hour * 24;

    let d = Math.floor(gap / (day));
    let h = Math.floor((gap % (day)) / (hour));
    let m = Math.floor((gap % (hour)) / (minute));
    let s = Math.floor((gap % (minute)) / (second));

    if (document.getElementById('day')) document.getElementById('day').innerText = d;
    if (document.getElementById('hour')) document.getElementById('hour').innerText = h;
    if (document.getElementById('minute')) document.getElementById('minute').innerText = m;
    if (document.getElementById('second')) document.getElementById('second').innerText = s;
}

setInterval(function() {
    countDown();
}, 1000)

// FINAL CALL: This replaces the old fetch block to initialize products and favorites
if (document.getElementById('product-list')) {
    fetchProducts();
}
