document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendMessage');
    const backButton = document.getElementById('backButton');
    
    let currentSession = null;

    // 获取当前会话信息
    chrome.storage.local.get(['currentSession'], function(result) {
        currentSession = result.currentSession;
    });

    // 自动调整输入框高度
    userInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
    });

    // 添加一个简单的节流函数
    let lastRequestTime = 0;
    const MIN_REQUEST_INTERVAL = 1000; // 最小请求间隔（毫秒）

    // 发送消息
    async function sendMessage(message) {
        // 检查是否需要等待
        const now = Date.now();
        const timeSinceLastRequest = now - lastRequestTime;
        if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
            await new Promise(resolve => 
                setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest)
            );
        }
        
        lastRequestTime = Date.now();
        
        try {
            // 从存储中获取 API key
            const { apiKey } = await chrome.storage.local.get(['apiKey']);
            
            if (!apiKey) {
                throw new Error('API key not found. Please set it in the settings.');
            }

            // 创建消息历史数组
            const messages = [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: message }
            ];

            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",  // 使用最新的模型名称
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1000,
                    n: 1,
                    stream: false
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    `API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`
                );
            }

            const data = await response.json();
            if (!data.choices || !data.choices[0]?.message?.content) {
                throw new Error('Invalid response format from API');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('Error details:', error);
            if (error.message.includes('429')) {
                return 'Rate limit exceeded. Please wait a moment before trying again.';
            }
            return `Error: ${error.message}`;
        }
    }

    // 添加重试机制
    async function sendMessageWithRetry(message, maxRetries = 3) {
        for (let i = 0; i < maxRetries; i++) {
            try {
                return await sendMessage(message);
            } catch (error) {
                if (error.message.includes('429') && i < maxRetries - 1) {
                    // 等待时间随重试次数增加
                    await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
                    continue;
                }
                throw error;
            }
        }
    }

    // 添加消息到聊天界面
    function appendMessage(content, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = `
            <div class="message-content">${content}</div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 显示输入中指示器
    function showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message assistant';
        indicator.innerHTML = `
            <div class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
            </div>
        `;
        indicator.id = 'typingIndicator';
        chatMessages.appendChild(indicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // 移除输入中指示器
    function removeTypingIndicator() {
        const indicator = document.getElementById('typingIndicator');
        if (indicator) {
            indicator.remove();
        }
    }

    // 事件监听器
    sendButton.addEventListener('click', function() {
        const message = userInput.value.trim();
        if (!message) return;

        // 添加用户消息到界面
        appendMessage(message, 'user');
        userInput.value = '';
        userInput.style.height = 'auto';

        // 显示加载指示器
        showTypingIndicator();

        sendMessage(message)
            .then(response => {
                // 移除加载指示器
                removeTypingIndicator();
                // 添加AI响应到界面
                appendMessage(response, 'assistant');
            })
            .catch(error => {
                console.error('Error:', error);
                removeTypingIndicator();
                appendMessage('Sorry, there was an error processing your request.', 'assistant');
            });
    });

    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    backButton.addEventListener('click', function() {
        window.location.href = 'popup.html';
    });
}); 