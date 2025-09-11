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

let countDate = new Date('june 1, 2023 00:00:00').getTime();

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


//products

fetch('http://localhost:3000/products')
.then(response => response.json())
.then(products => {
    console.log('Fetching products...');
    console.log(products); // This will show the array of product objects

    const container = document.getElementById('product-list');
    container.innerHTML = ''; // Clear any existing content

    products.forEach(product => {
        console.log(product);
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
            <span>Quantify:</span>
            <input type="number" min="1" max="100" value="1" placeholder="quantity">
            </div>
            <div class="price">
            $${product.price.toFixed(2)}<span> $${(product.price * 1.1).toFixed(2)}</span>
            </div>
            <a href="#" class="btn">Add to cart</a> `;
        container.appendChild(box);
    });
})
.catch(error => {
    console.error('Error loading products:', error);
});
