// js/product-detail.js
const REVIEWS_API_URL = 'http://localhost:3000/reviews';
const PRODUCTS_API_URL = 'http://localhost:3000/products';
const currentUserId = localStorage.getItem('userId');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    if (productId) {
        // 1. Load the single product info
        fetchProductDetails(productId);
        
        // 2. Load the reviews
        fetchAndRenderProductReviews(productId);
        
        // 3. Attach review submission listener
        const reviewForm = document.getElementById('add-review-form');
        if (reviewForm) {
            // Set the hidden product ID field
            document.getElementById('review-product-id').value = productId;
            reviewForm.addEventListener('submit', handleReviewSubmission);
        }
        
        // 4. Attach event delegation for helpful ratings
        document.getElementById('reviews-list-container')?.addEventListener('click', handleRating);
    } else {
        document.getElementById('single-product-info').innerHTML = '<p>Invalid product ID.</p>';
    }
});

// =========================================================================
// PRODUCT DETAILS FUNCTIONS
// =========================================================================

async function fetchProductDetails(productId) {
    try {
        const response = await fetch(`${PRODUCTS_API_URL}/${productId}`);
        const product = await response.json();

        if (response.ok) {
            renderProductDetails(product);
        } else {
            document.getElementById('single-product-info').innerHTML = `<p>${product.message || 'Product not found.'}</p>`;
        }
    } catch (error) {
        console.error('Error fetching product details:', error);
        document.getElementById('single-product-info').innerHTML = '<p>Error loading product details.</p>';
    }
}

function renderProductDetails(product) {
    const container = document.getElementById('single-product-info');
    if (!container) return;
    
    // Example rendering (You'll style this to match your site)
    container.innerHTML = `
        <div class="product-card" data-product-id="${product.id}">
            <img src="${product.image_url}" alt="${product.name}" style="max-width: 300px;">
            <div class="details">
                <h2>${product.name}</h2>
                <div class="price">$${product.price.toFixed(2)}</div>
                <p>Stock: ${product.stock_quantity > 0 ? 'In Stock' : 'Out of Stock'}</p>
                <p>Description: This is where the full product description would go.</p>
                <a href="#" class="btn add-to-cart-btn" data-product-id="${product.id}">Add to Cart</a>
            </div>
        </div>
    `;
    
    // NOTE: You must attach the add-to-cart listener here too (reusing script.js logic)
}

// =========================================================================
// REVIEW FUNCTIONS (Adapted from previous plan)
// =========================================================================

function renderReplies(replies, level = 0) {
    if (replies.length === 0) return '';
    
    let html = `<ul class="reply-level-${level}" style="list-style: none; padding-left: ${level * 20}px;">`;
    replies.forEach(reply => {
        const likedClass = reply.user_liked ? 'fas' : 'far'; // Fill heart if user liked
        
        html += `<li style="margin-top: 10px; border-left: 2px solid var(--green); padding-left: 10px;">
            <p><strong>${reply.username}</strong>: ${reply.reply_text}</p>
            <small>${reply.helpful_count || 0} people found this helpful.</small>
            <div class="actions">
                <a href="#" class="${likedClass} fa-thumbs-up rate-btn" 
                   data-id="${reply.id}" data-type="reply" title="Mark as Helpful"></a>
                </div>
            ${renderReplies(reply.replies, level + 1)}
        </li>`;
    });
    html += '</ul>';
    return html;
}

function renderReviews(reviews) {
    const container = document.getElementById('reviews-list-container');
    if (!container) return; 

    if (reviews.length === 0) {
        container.innerHTML = '<p>No customer reviews yet. Be the first to share your experience!</p>';
        return;
    }
    
    let html = '';
    reviews.forEach(review => {
        const likedClass = review.user_liked ? 'fas' : 'far';
        
        html += `<div class="product-review-box" style="border-bottom: 1px solid #eee; padding-bottom: 1.5rem; margin-bottom: 1.5rem;">
            <h4>${review.review_title} (${review.rating} Stars)</h4>
            <p>${review.review_text}</p>
            <small>By: <strong>${review.username}</strong> on ${new Date(review.date_created).toLocaleDateString()}</small>
            <div class="actions">
                <small>${review.helpful_count || 0} people found this review helpful.</small>
                <a href="#" class="${likedClass} fa-thumbs-up rate-btn" 
                   data-id="${review.id}" data-type="review" title="Mark as Helpful"></a>
            </div>
            
            <div class="replies-container" style="margin-top: 1rem;">
                <h5>Replies:</h5>
                ${renderReplies(review.replies)}
            </div>
        </div>`;
    });
    container.innerHTML = html;
}

async function fetchAndRenderProductReviews(productId) {
    try {
        const response = await fetch(`${REVIEWS_API_URL}/product/${productId}`);
        const reviews = await response.json();
        
        if (response.ok) {
            renderReviews(reviews);
        } else {
            console.error('Failed to fetch reviews:', reviews);
            document.getElementById('reviews-list-container').innerHTML = '<p>Error loading reviews.</p>';
        }
    } catch (error) {
        console.error('Network error fetching reviews:', error);
    }
}

async function handleReviewSubmission(e) {
    e.preventDefault();
    
    const productId = document.getElementById('review-product-id').value;
    const rating = document.getElementById('review-rating').value;
    const title = document.getElementById('review-title').value;
    const text = document.getElementById('review-text').value;
    
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('Please log in to submit a review.');
        // Show login form (assuming userlogin var exists in global script)
        return;
    }

    try {
        const response = await fetch(REVIEWS_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                userId: userId, // Passed for backend authentication
                product_id: productId,
                rating: parseInt(rating),
                title: title,
                text: text
            })
        });

        const result = await response.json();
        if (response.ok) {
            alert(result.message);
            document.getElementById('add-review-form').reset();
            fetchAndRenderProductReviews(productId); // Reload reviews
        } else {
            alert(`Review submission failed: ${result.error || 'Server error.'}`);
        }
    } catch (error) {
        console.error('Error submitting review:', error);
    }
}

async function handleRating(e) {
    const target = e.target.closest('.rate-btn');
    if (!target) return;
    e.preventDefault();

    const type = target.dataset.type; // 'review' or 'reply'
    const itemId = target.dataset.id;
    const userId = localStorage.getItem('userId');

    if (!userId) {
        alert('Please log in to mark content as helpful.');
        return;
    }
    
    // The backend handles the toggle/insert/update logic
    const data = {
        userId: userId,
        is_helpful: true // We assume clicking the button means "Helpful"
    };

    if (type === 'review') {
        data.review_id = itemId;
    } else {
        data.reply_id = itemId;
    }

    try {
        const response = await fetch(`${REVIEWS_API_URL}/rate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        if (response.ok) {
            const productId = new URLSearchParams(window.location.search).get('id');
            fetchAndRenderProductReviews(productId); // Reload the thread
        } else {
            const result = await response.json();
            alert(`Failed to rate: ${result.error || 'Server error.'}`);
        }
    } catch (error) {
        console.error('Rating failed:', error);
    }
}