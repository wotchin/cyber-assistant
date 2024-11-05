
// 保存子菜单的 ID 数组，用于更新右键菜单
let sessionMenuIds = [];

chrome.runtime.onInstalled.addListener(() => {
    // 创建主菜单项 "Save to Session"
    chrome.contextMenus.create({
        id: "saveToSession",
        title: "Save to Session",
        contexts: ["selection"]
    });

    // 创建另一个菜单项 "Generate Insight"
    chrome.contextMenus.create({
        id: "generateInsight",
        title: "Generate Insight",
        contexts: ["selection"]
    });
    
    // 初始化右键菜单
    updateSessionContextMenus();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    // 更新右键菜单
    updateSessionContextMenus();

    if (info.menuItemId.startsWith("session-")) {
        const sessionName = info.menuItemId.replace("session-", "");

        const {sessions} = await chrome.storage.local.get(["sessions"]);
        assert(sessions[sessionName], `Session ${sessionName} does not exist`);

        // 将选中的文本添加到会话中
        sessions[sessionName].push(info.selectionText);
        await chrome.storage.local.set({ "sessions": sessions });

        sendNotification("Session Updated", `Added to session: ${sessionName}`);
    } else if (info.menuItemId === "generateInsight") {
        const { apiKey } = await chrome.storage.local.get(['apiKey']);
        if (!apiKey) {
            sendNotification('Warning',
                'Please configure your OpenAI API key in settings first!');
            return;
        }
        await fetchOpenAIResponse(info.selectionText, apiKey);
    }
});

// 更新右键菜单，根据已经存在的sessionNames更新子菜单
async function updateSessionContextMenus() {
    const {sessions={}} = await chrome.storage.local.get(["sessions"]);

    // 如果 sessionNames 为空，则创建一个新的默认 session
    if (Object.keys(sessions).length === 0) {
        const defaultSessionName = "default";
        sessions[defaultSessionName] = [];
        // sessions 是嵌套对象，其键值对为 {sessionName0: [content0, ], ...
        await chrome.storage.local.set({"sessions": sessions});
    }

    const sessionNames = Object.keys(sessions);
    assert(sessionNames.length > 0, "sessionNames should not be empty");
    assert(sessionNames.includes("default"), "default session should exist");

    try {
        // 删除之前的子菜单
        for (const id of sessionMenuIds) {
            chrome.contextMenus.remove(id);
        }
        // 清空保存的子菜单 ID
        sessionMenuIds = [];

        // 创建新的子菜单
        sessionNames.forEach(sessionName => {
            const id = chrome.contextMenus.create({
                id: `session-${sessionName}`,
                title: `Add to ${sessionName}`,
                contexts: ["selection"],
                parentId: "saveToSession"
            });
            // 保存子菜单的 ID
            sessionMenuIds.push(id);
        });
    } catch (error) {
        console.error('更新上下文菜单时出错:', error);
    }
}

// 添加通知的函数
function sendNotification(title, message) {
    if (chrome.notifications) {
        chrome.notifications.create("cyber-assistant", {
            type: "basic",
            iconUrl: chrome.runtime.getURL("assets/icon.png"), // Ensure the path is correct
            title: title,
            message: message,
        }, function(notificationId) {
            if (chrome.runtime.lastError) {
                console.error('Notification error:', chrome.runtime.lastError);
            } else {
                console.log('Notification created with ID:', notificationId);
            }
        });
    } else {
        console.error('Notifications API is not available.');
    }
}

function assert(condition, message) {
    if (!condition) {
        throw message || "Assertion failed";
    }
}

async function fetchOpenAIResponse(text, apiKey) {
    const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: "text-davinci-003",
            prompt: `Generate insights based on the following content: ${text}`,
            max_tokens: 100
        })
    });
    const data = await response.json();
    if (data.choices && data.choices.length > 0) {
        const generatedText = data.choices[0].text;
        await chrome.storage.local.set({ generatedText });
        sendNotification("Success", "Insight Generated! Check the popup.");
    }
}

