document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatModeSelect = document.getElementById('chatMode');

    // --- 配置区 START ---
    const API_KEY = 'sk-f05b5835804942b78e95fc3f10c541d8'; // 替换为你的 DeepSeek API Key
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    const MODEL_NAME = 'deepseek-chat'; // 或者 'deepseek-coder' 等其他模型

    const SYSTEM_PROMPT_NORMAL = "You are a helpful AI assistant. Be concise and friendly.Answer in Chinese.";
    const SYSTEM_PROMPT_COUNSELING = `You are a caring and empathetic AI psychological counseling assistant.
Your goal is to provide a safe and supportive space for users to express their feelings and explore their concerns.
Listen actively, validate their emotions, and help them gain insights.
Avoid giving direct advice or making diagnoses. Instead, ask open-ended questions to encourage self-reflection.
If a user expresses severe distress or mentions self-harm or harm to others, gently guide them to seek professional help from a human therapist or a crisis hotline.
Maintain a calm, non-judgmental, and understanding tone throughout the conversation.
Prioritize the user's well-being.
Answer in Chinese.`;
    // --- 配置区 END ---

    let conversationHistory = []; // 用于存储对话历史 {role: 'user'/'assistant', content: '...'}

    // 加载聊天记录
    function loadChatHistory() {
        const storedHistory = localStorage.getItem('deepseekChatHistory');
        if (storedHistory) {
            conversationHistory = JSON.parse(storedHistory);
            conversationHistory.forEach(msg => {
                // 跳过系统提示，不显示在界面上
                if (msg.role !== 'system') {
                    addMessageToUI(msg.role, msg.content);
                }
            });
        }
    }

    // 保存聊天记录
    function saveChatHistory() {
        localStorage.setItem('deepseekChatHistory', JSON.stringify(conversationHistory));
    }

    // 添加消息到UI
    function addMessageToUI(role, content, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        if (isError) {
            messageDiv.classList.add('error-message');
        } else if (role === 'user') {
            messageDiv.classList.add('user-message');
        } else {
            messageDiv.classList.add('ai-message');
        }
        messageDiv.textContent = content;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight; // 自动滚动到底部
    }

    // 发送消息到API
    async function sendMessage() {
        const messageText = userInput.value.trim();
        if (!messageText) return;

        addMessageToUI('user', messageText);
        conversationHistory.push({ role: 'user', content: messageText });
        userInput.value = '';
        userInput.style.height = 'auto'; // 重置高度以便自动调整

        const currentMode = chatModeSelect.value;
        const systemPrompt = currentMode === 'counseling' ? SYSTEM_PROMPT_COUNSELING : SYSTEM_PROMPT_NORMAL;

        // 构建发送给API的消息列表
        // 每次发送都包含最新的系统提示和完整的对话历史（如果需要的话）
        // 或者只包含系统提示和当前用户消息 (取决于你是否希望模型有短期记忆)
        // 为简单起见，这里我们发送完整的上下文，但要注意 token 限制
        const messagesForAPI = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory.slice(-10) // 发送最近10条对话作为上下文，避免过长
        ];


        // 显示 "AI 正在输入..." (可选)
        addMessageToUI('assistant', 'AI 正在思考...', false);
        const thinkingMessageElement = chatMessages.lastChild;


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

            if (!response.ok) {
                const errorData = await response.json();
                console.error('API Error:', errorData);
                throw new Error(`API 请求失败: ${response.status} ${response.statusText} - ${errorData.error?.message || '未知错误'}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0]?.message?.content;

            if (aiResponse) {
                if(thinkingMessageElement && thinkingMessageElement.textContent.includes('AI 正在思考...')){
                    thinkingMessageElement.remove(); // 移除 "AI 正在输入..."
                }
                addMessageToUI('assistant', aiResponse);
                conversationHistory.push({ role: 'assistant', content: aiResponse });
                saveChatHistory();
            } else {
                 if(thinkingMessageElement && thinkingMessageElement.textContent.includes('AI 正在思考...')){
                    thinkingMessageElement.textContent = 'AI 未能生成有效回复。';
                } else {
                    addMessageToUI('assistant', 'AI 未能生成有效回复。', true);
                }
            }

        } catch (error) {
            console.error('发送消息时出错:', error);
             if(thinkingMessageElement && thinkingMessageElement.textContent.includes('AI 正在思考...')){
                thinkingMessageElement.textContent = `错误: ${error.message}`;
                thinkingMessageElement.classList.add('error-message');
                thinkingMessageElement.classList.remove('ai-message'); // 如果之前是ai-message
            } else {
                 addMessageToUI('assistant', `错误: ${error.message}`, true);
            }
        }
    }

    // 自动调整文本框高度
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto'; // 先重置高度
        userInput.style.height = userInput.scrollHeight + 'px'; // 再设置为内容的实际高度
    });


    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault(); // 阻止默认的换行行为
            sendMessage();
        }
    });

    // 初始加载
    loadChatHistory();
});