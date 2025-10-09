// Add this to your ./js/chatbot.js file
function toggleChatbot() {
    const chatContainer = document.getElementById('chatbot-container');
    
    // Check the current display style
    if (chatContainer.style.display === 'none' || chatContainer.style.display === '') {
        chatContainer.style.display = 'flex'; // Show the chatbot
    } else {
        chatContainer.style.display = 'none'; // Hide the chatbot
    }
}

// Placeholder functions for the buttons (you'll implement logic later)
function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}

function sendMessage() {
    const userInput = document.getElementById('user-input');
    const message = userInput.value.trim();
    if (message) {
        // Here you would add the user message to the chat-body
        console.log("User sent: " + message);
        userInput.value = ''; // Clear the input field
        // Add bot response logic here
    }
}