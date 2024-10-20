const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const sendButton = document.getElementById('send-button');
const imageInput = document.getElementById('image-input');
const imageButton = document.getElementById('image-button');
const themeToggleButton = document.getElementById('theme-toggle');

const newConversationButton = document.getElementById('new-conversation');
const conversationListButton = document.getElementById('conversation-list-button');
const conversationListModal = document.getElementById('conversation-list-modal');
const closeModalButtons = document.querySelectorAll('.close-button');
const conversationList = document.getElementById('conversation-list');
const editConversationNameModal = document.getElementById('edit-conversation-name-modal');
const editConversationNameInput = document.getElementById('edit-conversation-name-input');

let conversations = loadConversations();
let currentConversationId = null;
let conversationHistory = [];

const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'light') {
    document.body.classList.add('light-theme');
}

function updateThemeIcon() {
    const icon = themeToggleButton.querySelector('i');
    if (document.body.classList.contains('light-theme')) {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
    } else {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
    }
}

updateThemeIcon();

themeToggleButton.addEventListener('click', toggleTheme);

function toggleTheme() {
    document.body.classList.toggle('light-theme');
    const isLightTheme = document.body.classList.contains('light-theme');
    localStorage.setItem('theme', isLightTheme ? 'light' : 'dark');
    updateThemeIcon();
}

init();

function init() {
    if (conversations.length > 0) {
        loadConversation(conversations[conversations.length - 1].id);
    } else {
        startNewConversation();
    }
}

newConversationButton.addEventListener('click', () => {
    startNewConversation();
});

conversationListButton.addEventListener('click', () => {
    openConversationListModal();
});

closeModalButtons.forEach(button => {
    button.addEventListener('click', (event) => {
        const modal = event.target.closest('.modal');
        if (modal) {
            modal.style.display = 'none';
        }
        document.body.classList.remove('modal-open');
    });
});

window.addEventListener('click', (event) => {
    if (event.target.classList.contains('modal')) {
        closeAllModals();
    }
});

function startNewConversation() {
    if (conversationHistory.length > 0) {
        saveCurrentConversation();
    }

    chatMessages.innerHTML = '';
    conversationHistory = [];
    currentConversationId = generateConversationId();

    addMessage('Welcome! How can I assist you today?', false);
}

function generateConversationId() {
    return 'conv-' + Date.now();
}

function saveCurrentConversation() {
    const firstUserMessage = conversationHistory.find(msg => msg.role === 'user');
    let conversationName = 'Conversation on ' + new Date().toLocaleString();

    if (firstUserMessage) {
        conversationName = firstUserMessage.content.substring(0, 30) + '...';
    }

    const conversation = {
        id: currentConversationId,
        name: conversationName,
        history: conversationHistory
    };

    saveConversation(conversation);
}

function saveConversation(conversation) {
    const existingIndex = conversations.findIndex(conv => conv.id === conversation.id);

    if (existingIndex !== -1) {
        conversations[existingIndex] = conversation;
    } else {
        conversations.push(conversation);
    }

    localStorage.setItem('conversations', JSON.stringify(conversations));
}

function loadConversations() {
    const savedConversations = localStorage.getItem('conversations');
    return savedConversations ? JSON.parse(savedConversations) : [];
}

function closeAllModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
}

function openConversationListModal() {
    conversationList.innerHTML = '';

    conversations.forEach((conv, index) => {
        const li = document.createElement('li');
        li.textContent = conv.name;
        li.dataset.conversationId = conv.id;
        
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('button-container');

        const loadButton = document.createElement('button');
        loadButton.innerHTML = '<i class="fas fa-folder-open"></i>';
        loadButton.title = 'Load Conversation';
        loadButton.addEventListener('click', () => loadConversation(conv.id));

        const editButton = document.createElement('button');
        editButton.innerHTML = '<i class="fas fa-edit"></i>';
        editButton.title = 'Edit Conversation Name';
        editButton.addEventListener('click', () => openEditConversationNameModal(conv.id, conv.name));

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteButton.title = 'Delete Conversation';
        deleteButton.addEventListener('click', () => deleteConversation(index));

        buttonContainer.appendChild(loadButton);
        buttonContainer.appendChild(editButton);
        buttonContainer.appendChild(deleteButton);

        li.appendChild(buttonContainer);

        conversationList.appendChild(li);
    });

    conversationListModal.style.display = 'block';
    document.body.classList.add('modal-open');
}

function deleteConversation(index) {
    if (confirm('Are you sure you want to delete this conversation?')) {
        conversations.splice(index, 1);
        localStorage.setItem('conversations', JSON.stringify(conversations));
        openConversationListModal();
    }
}

function openEditConversationNameModal(conversationId, currentName) {
    editConversationNameInput.value = currentName;
    editConversationNameModal.style.display = 'block';
    editConversationNameModal.dataset.conversationId = conversationId;
}

function closeEditConversationNameModal() {
    editConversationNameModal.style.display = 'none';
}

function saveEditedConversationName() {
    const conversationId = editConversationNameModal.dataset.conversationId;
    const newName = editConversationNameInput.value.trim();

    if (newName) {
        const conversation = conversations.find(conv => conv.id === conversationId);
        if (conversation) {
            conversation.name = newName;
            localStorage.setItem('conversations', JSON.stringify(conversations));
            closeEditConversationNameModal();
            openConversationListModal();
        }
    }
}

document.getElementById('close-edit-modal').addEventListener('click', closeEditConversationNameModal);
document.getElementById('save-conversation-name').addEventListener('click', saveEditedConversationName);

function loadConversation(conversationId) {
    if (conversationHistory.length > 0) {
        saveCurrentConversation();
    }

    const conversation = conversations.find(conv => conv.id === conversationId);

    if (conversation) {
        currentConversationId = conversation.id;
        conversationHistory = conversation.history;

        renderConversation();
    }
}

function renderConversation() {
    chatMessages.innerHTML = '';

    conversationHistory.forEach(message => {
        if (message.type === 'image') {
            addImageMessage(message.content, message.role === 'user', false);
        } else {
            addMessage(message.content, message.role === 'user', false);
        }
    });

    scrollToBottom();
}

function addMessage(content, isUser, saveToHistory = true) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message', isUser ? 'user-message' : 'ai-message');

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');

    renderContent(content, messageContent);

    messageWrapper.appendChild(messageContent);
    chatMessages.appendChild(messageWrapper);
    scrollToBottom();

    if (saveToHistory) {
        conversationHistory.push({ role: isUser ? 'user' : 'assistant', content });
    }
}

function addImageMessage(imageSrc, isUser, saveToHistory = true) {
    const messageWrapper = document.createElement('div');
    messageWrapper.classList.add('message', isUser ? 'user-message' : 'ai-message');

    const messageContent = document.createElement('div');
    messageContent.classList.add('message-content');

    const imageElement = document.createElement('img');
    imageElement.src = imageSrc;
    imageElement.alt = 'Uploaded Image';
    imageElement.classList.add('message-image');

    messageContent.appendChild(imageElement);
    messageWrapper.appendChild(messageContent);
    chatMessages.appendChild(messageWrapper);
    scrollToBottom();

    if (saveToHistory) {
        conversationHistory.push({ role: isUser ? 'user' : 'assistant', content: imageSrc, type: 'image' });
    }
}

function renderContent(content, container) {
    const renderMath = (mathContent, displayMode) => {
        const span = document.createElement('span');
        katex.render(mathContent, span, {
            throwOnError: false,
            displayMode: displayMode,
            errorCallback: (err) => {
                console.error('KaTeX error:', err);
                span.textContent = `Error rendering math: ${err.message}`;
            }
        });
        return span;
    };

    const regex = /(\$\$(.*?)\$\$|\\\((.*?)\\\)|\\\[(.*?)\\\])/gs;
    let cursor = 0;
    let match;

    while ((match = regex.exec(content)) !== null) {
        if (match.index > cursor) {
            container.appendChild(document.createTextNode(content.substring(cursor, match.index)));
        }
        const mathContent = match[2] || match[3] || match[4];
        const isDisplayMath = match[0].startsWith('$$') || match[0].startsWith('\\[');

        container.appendChild(renderMath(mathContent, isDisplayMath));

        cursor = match.index + match[0].length;
    }

    if (cursor < content.length) {
        container.appendChild(document.createTextNode(content.substring(cursor)));
    }
}

function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

async function sendMessage() {
    const message = userInput.value.trim();
    if (message) {
        addMessage(message, true);

        userInput.value = '';
        userInput.focus();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message, history: conversationHistory }),
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            addMessage(data.response, false);

        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, there was an error processing your request.', false);
        }
    }
}

sendButton.addEventListener('click', sendMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

imageButton.addEventListener('click', () => {
    imageInput.click();
});

imageInput.addEventListener('change', async () => {
    const file = imageInput.files[0];
    if (file) {
        const imageUrl = URL.createObjectURL(file);
        addImageMessage(imageUrl, true);

        imageInput.value = '';

        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch('/upload-image', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            addMessage(data.response, false);

        } catch (error) {
            console.error('Error:', error);
            addMessage('Sorry, there was an error processing your image.', false);
        }
    }
});

userInput.focus();
