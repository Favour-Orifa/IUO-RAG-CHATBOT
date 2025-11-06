// ================================
// PART 1: GET REFERENCES TO HTML ELEMENTS
// ================================

// Get the elements we need to interact with
const chatContainer = document.getElementById('chatContainer');
const userInput = document.getElementById('userInput');
const sendButton = document.getElementById('sendButton');

// Store session ID (for conversation continuity)
let sessionId = 'user_' + Date.now(); // Creates unique ID like "user_1234567890"

console.log('Session ID:', sessionId); // For debugging

// ================================
// PART 2: FUNCTION TO ADD MESSAGES TO CHAT
// ================================

function addMessage(text, isUser, sources = []) {
    // Create a new message div
    const messageDiv = document.createElement('div');
    messageDiv.className = isUser ? 'message user-message' : 'message ai-message';
    
    // Create the content div
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    // Add the sender label and text
    const label = isUser ? 'You' : 'AI';
    contentDiv.innerHTML = `<strong>${label}:</strong> ${text}`;
    
    // If there are sources, add them
    if (sources.length > 0) {
        const sourcesDiv = document.createElement('div');
        sourcesDiv.className = 'sources';
        sourcesDiv.innerHTML = `📄 <strong>Sources:</strong> Pages ${sources.join(', ')}`;
        contentDiv.appendChild(sourcesDiv);
    }
    
    // Put it all together
    messageDiv.appendChild(contentDiv);
    chatContainer.appendChild(messageDiv);
    
    // Scroll to bottom to show new message
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

// ================================
// PART 3: FUNCTION TO SEND MESSAGE
// ================================

async function sendMessage() {
    // Get the user's question
    const question = userInput.value.trim();
    
    // Don't send if empty
    if (question === '') {
        return;
    }
    
    // Add user's message to chat
    addMessage(question, true);
    
    // Clear the input box
    userInput.value = '';
    
    // Disable button while waiting for response
    sendButton.disabled = true;
    sendButton.textContent = 'Thinking...';
    
    // Add a loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message ai-message';
    loadingDiv.innerHTML = '<div class="message-content"><strong>AI:</strong> <span class="loading">Thinking</span></div>';
    loadingDiv.id = 'loading-message';
    chatContainer.appendChild(loadingDiv);
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    try {
        // ================================
        // THIS IS WHERE WE'LL CALL YOUR API
        // For now, we'll use MOCK DATA (fake responses)
        // ================================
        
        // MOCK RESPONSE (pretending to call API)
        await simulateAPICall(question);
        
        // Remove loading message
        loadingDiv.remove();
        
    } catch (error) {
        // If something goes wrong
        console.error('Error:', error);
        loadingDiv.remove();
        addMessage('Sorry, I encountered an error. Please try again.', false);
    } finally {
        // Re-enable button
        sendButton.disabled = false;
        sendButton.textContent = 'Send';
    }
}

// ================================
// PART 4: SIMULATE API CALL (MOCK DATA)
// ================================

async function simulateAPICall(question) {
    // Simulate network delay (1-2 seconds)
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
    
    // Mock responses based on keywords
    let answer = '';
    let sources = [];
    
    // Check what the user asked
    const lowerQuestion = question.toLowerCase();
    
    if (lowerQuestion.includes('vice chancellor') || lowerQuestion.includes('vc')) {
        answer = 'The Vice Chancellor of Igbinedion University Okada is Prof. Lawrence Ezemonye. He has been serving in this capacity and brings extensive experience in academic leadership.';
        sources = [5, 12];
    } 
    else if (lowerQuestion.includes('admission') || lowerQuestion.includes('requirements')) {
        answer = 'Admission requirements vary by program. Generally, candidates need a minimum of 5 O\'level credits including English and Mathematics. JAMB UTME score requirements differ by course.';
        sources = [15, 16, 17];
    }
    else if (lowerQuestion.includes('fees') || lowerQuestion.includes('tuition')) {
        answer = 'Tuition fees vary by faculty and program. For specific fee information, please refer to the current fee schedule in the prospectus or contact the bursary department.';
        sources = [45, 46];
    }
    else if (lowerQuestion.includes('courses') || lowerQuestion.includes('programs')) {
        answer = 'IUO offers a wide range of undergraduate and postgraduate programs across multiple faculties including Medicine, Law, Engineering, Arts, Sciences, and Social Sciences.';
        sources = [20, 21, 22];
    }
    else {
        // Default response for questions we don't have mock data for
        answer = `I received your question: "${question}". This is a mock response. When connected to the real API, I'll search the prospectus and give you accurate information!`;
        sources = [1];
    }
    
    // Add the AI response
    addMessage(answer, false, sources);
}

// ================================
// PART 5: EVENT LISTENERS
// ================================

// When Send button is clicked
sendButton.addEventListener('click', sendMessage);

// When Enter key is pressed in input
userInput.addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
});

// Focus on input when page loads
userInput.focus();

// ================================
// INITIALIZATION MESSAGE
// ================================

console.log('IUO Chat App initialized!');
console.log('Try asking: Who is the vice chancellor?');