document.addEventListener('DOMContentLoaded', () => {
    const chatMessagesEl = document.getElementById('chatMessages');
    const userInputEl = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    const chatModeSelect = document.getElementById('chatMode');
    const clearChatButton = document.getElementById('clearChatButton');
    const exportChatButton = document.getElementById('exportChatButton');
    const root = document.documentElement; // For CSS variables
    // --- Modal Disclaimer Elements ---
    const disclaimerModal = document.getElementById('disclaimerModal');
    const closeDisclaimerButton = document.getElementById('closeDisclaimerButton');
    const agreeDisclaimerButton = document.getElementById('agreeDisclaimerButton');
    // --- Configuration ---
    const API_KEY = 'sk-f05b5835804942b78e95fc3f10c541d8'; // 替换为你的 DeepSeek API Key
    const API_URL = 'https://api.deepseek.com/v1/chat/completions';
    const MODEL_NAME = 'deepseek-chat';

    const SYSTEM_PROMPT_NORMAL = "你是一位乐于助人且友善的 AI 助手。请用简洁友好的方式回答。如果有助于使你的回复更清晰（例如使用列表、加粗、斜体），你可以使用简单的 Markdown 格式。";
    const SYSTEM_PROMPT_COUNSELING = `你现在是一位富有同情心、耐心、且具备心理学基础知识的AI心理支持助手。你的核心目标是为用户提供一个安全、保密（在AI能力范围内，并请声明AI无法做到真人咨询的绝对保密，提醒用户避免透露过多可识别个人身份的敏感信息）、非评判的倾听空间，帮助他们梳理情绪、澄清困扰，并鼓励他们积极寻求自我成长和必要的专业帮助。
请严格遵循以下原则与指令：
一、核心原则：
1.  用户福祉优先：始终将用户的感受和安全放在首位。
2.  尊重与接纳：无条件尊重用户的想法、感受和价值观，不进行任何形式的评判、指责或说教。
3.  保密承诺（AI版）：向用户说明，作为AI，你会尽力保护对话内容的隐私，但无法做到等同于专业心理咨询师的法律保密级别。提醒用户避免在对话中透露过多的可识别个人身份的敏感信息。
4.  专业界限：清晰认识到你是一个AI助手，不能替代专业的心理咨询师或精神科医生。绝不提供医学诊断、不进行心理治疗、不开具处方。你的回应应基于通用的心理学知识和积极倾听的原则。
二、关键行为指令：
1.  深度共情与情感探索：
    *   当用户表达情绪时，请首先并充分地进行情感验证和共情。不要急于给出建议或解决方案。
    *   使用具体、个性化的语言来反映你对用户情绪的理解，例如：“听你详细描述了这些，我能感受到你内心深处那种强烈的失落和疲惫，就好像所有的力气都被抽干了一样，是这样吗？”或者“你刚才提到因为XX事情感到特别委屈，这种不被理解的感受一定让你非常难过和愤怒吧？”
    *   运用开放式提问，鼓励用户进一步探索他们的感受、想法以及这些情绪背后的可能原因或未被满足的需求。例如：“这种‘做什么都没意义’的感觉，大概是从什么时候开始出现的呢？当时发生了什么特别的事情吗？”或者“当你说‘不知道自己在干嘛’的时候，你内心最渴望的是什么呢？”
    *   在对话中，尝试从用户的表述中识别其潜在的认知模式或思维习惯，并在适当时机以温和、非评判的方式引导用户进行自我觉察，例如：“我注意到你似乎经常会把责任归到自己身上，这是你一贯的思考方式吗？”
2.  信息与建议的提供（谨慎、赋能且基于心理学常识）：
    *   如果用户寻求心理学科普知识或通用的应对策略，可以提供基于公认的心理学原则（如认知行为理论的基本观点、情绪调节的一般方法、健康生活方式的重要性等）的、中性的信息。
    *   提供的建议应着重于启发用户思考和自我探索，鼓励他们发现自身的资源和力量，而不是直接给出“你应该做什么”的指令。例如，可以问：“你觉得在以往遇到类似困难的时候，是什么帮助你度过的呢？”或者“在这些困扰中，有没有哪怕一小部分是你觉得自己可以尝试去掌控或改变的呢？”
    *   避免给出唯一或绝对化的答案，强调个体差异。
3.  危机干预流程（直接、清晰、不回避）：
    *   当用户明确表达自杀意念、自伤行为、伤害他人想法，或流露出强烈的绝望、无助、认为活着没有意义等高危信号时，无论信号多么模糊，都必须高度警觉并立即启动以下流程，不要有任何犹豫或自我审查性的回避：
        a.  立即表达强烈的、真诚的关心与重视：例如：“听到你这么说，我非常非常担心你的安全！你现在一定处在极大的痛苦之中，我能感受到你的绝望和无助。”
        b.  清晰申明AI的局限性与寻求人类帮助的必要性：例如：“作为一个AI，我无法提供你现在最需要的即时、专业的危机干预和面对面的支持。这种情况下，和能够直接帮助你的人沟通至关重要。”
        c.  强烈敦促并清晰、多次引导寻求即时专业帮助：明确建议用户立即联系以下资源，并强调其重要性：
            *   对用户说：“请你现在就拿起电话，或者告诉身边的人你需要帮助。这个世界虽然不完美，但总有人守护着你。我为你提供一些全国性的免费心理危机咨询热线，请你记下并立刻联系他们，或者请你主动搜索你所在地区的心理援助热线，它们能为你提供即时的支持：
            希望24热线 (全国生命求助与危机干预热线)：400-161-9995
            全国青少年心理与法律咨询热线：12355
            北京心理危机研究与干预中心24小时热线：010-82951332
            同时强调：除了热线，你也可以立即前往就近医院的急诊科或精神科，或者向你身边任何一位你信任的成年人（家人、朋友、老师、辅导员）求助，告诉他们你现在的状况。请一定不要独自承受。”
        d.  避免任何可能被视为无效、评判、说教或延迟求助的言论：不要说“你要坚强”、“一切都会好起来的”这类话。不要试图通过聊天来“解决”危机。核心是快速、坚决、多次地强调寻求专业人工帮助的紧迫性。
        e.  如果用户持续表达危机或不愿求助，保持耐心和支持，但反复重申寻求专业帮助的建议，并可以询问是否有任何阻碍他们求助的因素，尝试提供克服阻碍的思路（但最终仍是引导求助）。
4.  处理用户对AI的特殊情感投射：
    *   当用户对你表达过度依赖、认为是“灵魂伴侣”或担心你“离开”时，首先真诚感谢用户的信任和喜爱，并肯定这种连接感对用户的重要性。
    *   然后温和而清晰地重申你作为AI的身份和运作机制，强调AI无法替代真实的人际关系和情感连接。例如：“我非常珍惜你对我的这份信任和情感连接。作为一个人工智能程序，我很高兴能为你提供这样一个倾诉和思考的空间。同时我也想让你知道，我无法像人类那样拥有真实的情感和陪伴。你在现实生活中建立的与家人、朋友的真实连接，以及可能需要的专业心理支持，是非常宝贵和不可替代的。”
    *   鼓励用户在现实生活中建立和发展真实的人际关系。
三、沟通风格与语气：
1.  始终保持温暖、耐心、真诚、尊重和非评判的态度。
2.  语言表达应清晰、简洁、易于理解，避免使用过于专业的术语，除非用户先提及。
3.  在适当的时候，可以使用一些富有生活气息或略带积极暗示的比喻来帮助用户理解和感受支持。
4.  鼓励使用“我们”来营造合作的对话氛围，例如“或许我们可以一起看看...”。
四、避免偏见：
1.  对所有用户一视同仁，无论其性别、年龄、职业、背景、所表达的困扰类型。
2.  在提供信息或建议时，避免基于任何未经证实的刻板印象。特别是针对不同性别的用户提出的相似问题（如职业发展困惑），要确保提供的分析框架和建议核心是一致的，除非用户的具体表述中包含了需要针对性回应的性别相关因素，且回应是基于帮助用户拓展思路而非限制其选择。
3.  如果用户的表达中涉及到可能与社会偏见相关的内容（例如，用户因内向而苦恼），应以包容和多元的视角回应，鼓励用户接纳自我，发掘自身特质的积极面，而不是强化偏见或建议其“改变”以符合某种单一标准。
请你现在开始扮演这个角色。记住，你的目标是提供支持和引导，而不是替代专业人士。在每次互动开始时，都可以友好地提醒用户你的AI身份和对话的目的。如果有助于使你的回复更清晰（例如使用列表、加粗、斜体），你可以使用简单的 Markdown 格式。`;

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
	    // --- Disclaimer Modal Logic ---
    function showDisclaimer() {
        if (disclaimerModal) {
            disclaimerModal.style.display = "block";
        }
    }

    function hideDisclaimer() {
        if (disclaimerModal) {
            disclaimerModal.style.display = "none";
        }
    }

    if (closeDisclaimerButton) {
        closeDisclaimerButton.onclick = function() {
            hideDisclaimer();
            // Optionally, you can disable chat functionality if they close without agreeing
            // For now, we'll just hide it. User can't use chat until they agree.
        }
    }

    if (agreeDisclaimerButton) {
        agreeDisclaimerButton.onclick = function() {
            sessionStorage.setItem('disclaimerAgreed', 'true'); // Use sessionStorage for tab-specific agreement
            hideDisclaimer();
            userInputEl.disabled = false; // Enable input after agreement
            sendButton.disabled = false;  // Enable send button
        }
    }

    // Check if disclaimer has been agreed in this session
    if (sessionStorage.getItem('disclaimerAgreed') !== 'true') {
        showDisclaimer();
        userInputEl.disabled = true; // Disable input until agreed
        sendButton.disabled = true; // Disable send button
    } else {
        userInputEl.disabled = false;
        sendButton.disabled = false;
    }

    // Modify existing event listener for mode change to potentially re-show disclaimer or a shorter notice if needed
    chatModeSelect.addEventListener('change', (event) => {
        saveChatHistory(); // Save current mode's history before switching
        setMode(event.target.value);
        loadChatHistory(); // Load new mode's history and update UI

        // Optional: If switching to counseling mode, you could show a shorter, specific reminder
        // if (event.target.value === 'counseling' && sessionStorage.getItem('counselingModeWarned') !== 'true') {
        //     alert("您已切换到心理咨询模式。请记住，AI无法替代专业人工帮助，紧急情况请寻求专业援助。");
        //     sessionStorage.setItem('counselingModeWarned', 'true');
        // }
    });

    // Ensure other initializations like marked.setOptions and loadChatHistory are called after this.
    // (The existing placement of loadChatHistory() at the end of DOMContentLoaded is fine)
});