// In script.js
// Place these at the top of your script
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const cartIcon = document.querySelector('.fas.fa-shopping-cart');


// Function to handle displaying the logged-in user and buttons
async function displayLoggedInUser() {
    const userId = localStorage.getItem('userId');
    const userInfoDiv = document.getElementById('user-info');
    
    // Check if the login and logout buttons exist before manipulating them
    if (loginBtn && logoutBtn) {
        if (userId) {
            // User is logged in
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
                        cartIcon.href = 'cart.html'; // Ensure it links to the cart for regular users
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
                cartIcon.href = 'cart.html'; // Ensure it links to the cart when not logged in
            }
        }
    }
}

// Add the logout event listener
if (logoutBtn) {
    logoutBtn.addEventListener('click', (event) => {
        event.preventDefault(); // Prevent the link from navigating
        localStorage.removeItem('userId'); // Remove the user ID from storage
        window.location.reload(); // Reload the page to update the UI
    });
}

// Call the function to set the initial state when the page loads
displayLoggedInUser();

// Place all variable declarations at the top
const barmenu = document.querySelector('.nav-bar');
const navbars = document.querySelector('#menu-bar');
const header3 = document.querySelector('.header-3');
const scrollTop = document.querySelector('.scroll-top');
const userlogin = document.querySelector('.login-form-container');
const cart = document.querySelector('.cart-items-container');

// Only add event listeners to elements that exist in the HTML
if (navbars) {
    navbars.onclick = () => {
        navbars.classList.toggle('fa-times');
        barmenu.classList.toggle('active');
        //cart.classList.remove('active');
    }
}

// Check for the user login elements before adding the event listener
if (document.querySelector('#login-btn')) {
    document.querySelector('#login-btn').onclick = () => {
        userlogin.classList.toggle('active');
        navbars.classList.remove('fa-times');
        barmenu.classList.remove('active');
        //cart.classList.remove('active');
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
    // These variables are now correctly declared at the top of the file
    //cart.classList.remove('active');
    //userlogin.classList.remove('active');
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

    document.getElementById('day').innerText = d;
    document.getElementById('hour').innerText = h;
    document.getElementById('minute').innerText = m;
    document.getElementById('second').innerText = s;
}

setInterval(function() {
    countDown();
}, 1000)


// In script.js
fetch('http://localhost:3000/products')
.then(response => response.json())
.then(products => {
    console.log('Fetching products...');
    console.log(products);

    const container = document.getElementById('product-list');
    container.innerHTML = ''; // Clear any existing content

    products.forEach(product => {
        const box = document.createElement('div');
        box.className = 'box';
        box.innerHTML = `
            <span class="discount">-10%</span>
            <div class="icons">
                <a href="#" class="fas fa-heart"></a>
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
                <i class="fas fa-star"></i>
                <i class="fas fa-star"></i>
            </div>
            <div class="quantify">
                <span>Quantity:</span>
                <input type="number" min="1" max="100" value="1" id="quantity-${product.id}">
            </div>
            <div class="price">
                $${product.price.toFixed(2)}<span> $${(product.price * 1.1).toFixed(2)}</span>
            </div>
            <a href="#" class="btn" data-product-id="${product.id}">Add to cart</a>`;
        container.appendChild(box);
    });

    const addToCartButtons = document.querySelectorAll('.box .btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', async (event) => {
            event.preventDefault();
            const productId = event.target.dataset.productId;
            const quantityInput = document.getElementById(`quantity-${productId}`);
            
            // Check if quantity input exists before trying to access its value
            if (!quantityInput) {
                console.error("Quantity input element not found for product:", productId);
                return;
            }

            const quantity = parseInt(quantityInput.value);

            // Get userId from localStorage
            const userId = localStorage.getItem('userId');

            // Redirect to signin if not logged in
            if (!userId) {
                alert('Please sign in to add items to your cart.');
                window.location.href = 'signin.html';
                return;
            }
            //const userId = 11; // Hardcoded user ID

            const response = await fetch('http://localhost:3000/cart/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId,
                    productId,
                    quantity
                })
            });

            const result = await response.json();
            console.log(result.message);
        });
    });
})
.catch(error => {
    console.error('Error loading products:', error);
});
