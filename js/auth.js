// js/auth.js
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');

    if (loginForm) {
        loginForm.addEventListener('submit', async (event) => {
            event.preventDefault();

            const email = document.getElementById('login-email').value.trim();
            const password = document.getElementById('login-password').value.trim();

            try {
                const response = await fetch('http://localhost:3000/auth/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                const result = await response.json();


                if (response.ok) {
                    // Store the userId to use for cart operations
                    localStorage.setItem('userId', result.userId);
                    // Redirect to the homepage or cart page
                    window.location.href = 'index.html'; 
                } else {
                    alert(result.message);
                }
            } catch (error) {
                console.error('Login failed:', error);
                console.log('An error occurred. Please try again.');
            }
        });
    }
});