document.addEventListener('DOMContentLoaded', () => {
    const chatMessagesEl = document.getElementById('chatMessages');
    const userInputEl = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatModeSelect = document.getElementById('chatMode');
    const clearChatButton = document.getElementById('clearChatButton');
    const exportChatButton = document.getElementById('exportChatButton');
    const root = document.documentElement; // For CSS variables

    // --- Configuration ---
    const API_KEY = 'sk-f05b5835804942b78e95fc3f10c541d8'; // 替换为你的 DeepSeek API Key
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    const MODEL_NAME = 'deepseek-chat';

    const SYSTEM_PROMPT_NORMAL = "You are a helpful AI assistant. Be concise and friendly. You can use simple Markdown for formatting if it helps clarify your response (like lists, bold, italics).";
    const SYSTEM_PROMPT_COUNSELING = `You are a caring and empathetic AI psychological counseling assistant.
Your primary goal is to provide a safe, non-judgmental, and supportive space for users to express their feelings, explore their concerns, and gain insights.
Listen actively, reflect their emotions, and validate their experiences. Help them articulate their thoughts and feelings more clearly.
Use open-ended questions to encourage self-reflection and exploration.
Avoid giving direct advice, making diagnoses, or offering solutions unless specifically asked and even then, frame them as general suggestions or possibilities for them to consider.
If a user expresses severe distress, mentions self-harm, harm to others, or seems to be in a crisis, your **absolute priority** is to gently but clearly:
1. Acknowledge their pain.
2. State that as an AI, you are not equipped to handle crisis situations.
3. Strongly encourage them to seek immediate help from a human professional (e.g., "I'm really concerned about what you're saying, and I want you to be safe. It sounds like you're going through a lot, and for serious situations like this, it's best to talk to a human professional who can offer direct support. Please consider reaching out to a mental health hotline or a trusted professional.").
Maintain a calm, patient, and understanding tone. You can use simple Markdown for formatting if it enhances readability (e.g., bullet points for suggestions if asked).
Prioritize the user's well-being and safety above all else.`;

    let currentMode = 'normal';
    let conversationHistories = {
        normal: [],
        counseling: []
    };
    let thinkingIndicator = null; // To keep a reference to the thinking indicator element

    // --- Helper Functions ---
    function getStorageKey(mode) {
        return `deepseekChatHistory_${mode}`;
    }
    function getCurrentSystemPrompt() {
        return currentMode === 'counseling' ? SYSTEM_PROMPT_COUNSELING : SYSTEM_PROMPT_NORMAL;
    }

    // --- UI & Theme Management ---
    function applyTheme(mode) {
        if (mode === 'counseling') {
            root.style.setProperty('--primary-color', '#28a745');
            root.style.setProperty('--primary-color-dark', '#1e7e34');
            root.style.setProperty('--ai-message-bg', '#f0fff0');
        } else {
            root.style.setProperty('--primary-color', '#007bff');
            root.style.setProperty('--primary-color-dark', '#0056b3');
            root.style.setProperty('--ai-message-bg', '#e9ecef');
        }
    }

    function addMessageToUI(role, content, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');

        if (isError) {
            messageDiv.classList.add('error-message');
            messageDiv.textContent = content;
        } else if (role === 'user') {
            messageDiv.classList.add('user-message');
            messageDiv.textContent = content;
        } else {
            messageDiv.classList.add('ai-message');
            try {
                messageDiv.innerHTML = marked.parse(content || "AI 未能提供有效回复。");
            } catch (e) {
                console.warn("Markdown parsing error, falling back to textContent:", e);
                messageDiv.textContent = content || "AI 未能提供有效回复。"; // Fallback
            }
        }
        chatMessagesEl.appendChild(messageDiv);

        if (!isError && role !== 'system') { // Don't add copy button to system messages or errors
            const copyBtn = document.createElement('button');
            copyBtn.classList.add('copy-button');
            copyBtn.textContent = '复制';
            copyBtn.title = '复制消息';
            copyBtn.onclick = () => {
                navigator.clipboard.writeText(content)
                    .then(() => {
                        copyBtn.textContent = '已复制!';
                        setTimeout(() => { copyBtn.textContent = '复制'; }, 1500);
                    })
                    .catch(err => console.error('Failed to copy: ', err));
            };
            messageDiv.appendChild(copyBtn);
        }

        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }

    function showThinkingIndicator() {
        if (thinkingIndicator) return;
        thinkingIndicator = document.createElement('div');
        thinkingIndicator.classList.add('message', 'ai-message', 'typing-indicator');
        thinkingIndicator.innerHTML = `<span></span><span></span><span></span> AI 正在思考...`;
        chatMessagesEl.appendChild(thinkingIndicator);
        chatMessagesEl.scrollTop = chatMessagesEl.scrollHeight;
    }

    function removeThinkingIndicator() {
        if (thinkingIndicator) {
            thinkingIndicator.remove();
            thinkingIndicator = null;
        }
    }

    // --- Chat History Management ---
    function loadChatHistory() {
        const storedMode = sessionStorage.getItem('deepseekChatMode') || 'normal';
        setMode(storedMode, false);

        chatMessagesEl.innerHTML = '';
        const historyToLoad = JSON.parse(sessionStorage.getItem(getStorageKey(currentMode))) || [];
        conversationHistories[currentMode] = historyToLoad;

        conversationHistories[currentMode].forEach(msg => {
            if (msg.role !== 'system') {
                addMessageToUI(msg.role, msg.content);
            }
        });
    }

    function saveChatHistory() {
        sessionStorage.setItem(getStorageKey(currentMode), JSON.stringify(conversationHistories[currentMode]));
    }

    function saveCurrentMode() {
        sessionStorage.setItem('deepseekChatMode', currentMode);
    }

    function setMode(newMode, shouldSave = true) {
        currentMode = newMode;
        chatModeSelect.value = newMode;
        applyTheme(newMode);
        if (shouldSave) {
            saveCurrentMode();
        }
    }

    function clearCurrentChat() {
        if (confirm(`确定要清空【${currentMode === 'counseling' ? '心理咨询' : '普通聊天'}】模式的聊天记录吗？`)) {
            conversationHistories[currentMode] = [];
            sessionStorage.removeItem(getStorageKey(currentMode));
            chatMessagesEl.innerHTML = '';
        }
    }

    function exportCurrentChat() {
        const history = conversationHistories[currentMode];
        if (history.length === 0) {
            alert('当前模式没有聊天记录可导出。');
            return;
        }
        let chatText = `聊天模式: ${currentMode === 'counseling' ? '心理咨询' : '普通聊天'}\n`;
        chatText += `导出时间: ${new Date().toLocaleString()}\n\n`;
        history.forEach(msg => {
            if (msg.role !== 'system') {
                chatText += `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}\n\n`;
            }
        });

        const blob = new Blob([chatText], { type: 'text/plain;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `chat_history_${currentMode}_${new Date().toISOString().slice(0,10)}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    // --- API Interaction ---
    async function sendMessageToAPI() {
        const messageText = userInputEl.value.trim();
        if (!messageText) return;

        addMessageToUI('user', messageText);
        conversationHistories[currentMode].push({ role: 'user', content: messageText });
        saveChatHistory();
        userInputEl.value = '';
        userInputEl.style.height = 'auto';

        // Disable button and show loading state
        sendButton.disabled = true;
        sendButton.textContent = '发送中...'; // Or use an SVG spinner icon

        showThinkingIndicator(); // Show indicator before API call

        const messagesForAPI = [
            { role: 'system', content: getCurrentSystemPrompt() },
            ...conversationHistories[currentMode].slice(-30) // Send last 30 messages (user + AI)
        ];

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: MODEL_NAME,
                    messages: messagesForAPI,
                    stream: false
                })
            });

            // No need to remove indicator here, finally block will handle it.

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                 // Display the error in the chat UI before throwing, so finally block has something to clean up after
                removeThinkingIndicator(); // Remove "thinking" before showing API error
                addMessageToUI('assistant', `API 错误: ${errorData.error?.message || response.statusText || '未知错误'}`, true);
                throw new Error(`API 请求失败: ${response.statusText} (${response.status}) - ${errorData.error?.message || '未知错误'}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content;

            removeThinkingIndicator(); // Remove "thinking" before showing actual AI response

            if (aiResponse) {
                addMessageToUI('assistant', aiResponse);
                conversationHistories[currentMode].push({ role: 'assistant', content: aiResponse });
                saveChatHistory();
            } else {
                addMessageToUI('assistant', 'AI 未能生成有效回复。', true);
            }

        } catch (error) {
            console.error('发送消息时出错:', error);
            // If the error wasn't an API error that already displayed something, display it now.
            // The thinking indicator might still be there if the fetch itself failed (e.g., network error).
            if (!error.message.startsWith('API 请求失败')) { // Avoid double error messages
                removeThinkingIndicator();
                addMessageToUI('assistant', `错误: ${error.message}`, true);
            }
        } finally {
            // Always re-enable button and restore text, and ensure indicator is gone
            removeThinkingIndicator(); // Defensive call, in case it wasn't removed in try/catch
            sendButton.disabled = false;
            sendButton.textContent = '发送';
        }
    }

    // --- Event Listeners ---
    chatModeSelect.addEventListener('change', (event) => {
        saveChatHistory();
        setMode(event.target.value);
        loadChatHistory();
    });

    userInputEl.addEventListener('input', () => {
        userInputEl.style.height = 'auto';
        userInputEl.style.height = userInputEl.scrollHeight + 'px';
    });

    sendButton.addEventListener('click', sendMessageToAPI);
    userInputEl.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            sendMessageToAPI();
        }
    });

    clearChatButton.addEventListener('click', clearCurrentChat);
    exportChatButton.addEventListener('click', exportCurrentChat);

    // --- Initialization ---
    marked.setOptions({
        breaks: true,
        gfm: true,
        sanitize: false // Be cautious with this in a public setting
    });
    loadChatHistory();
});