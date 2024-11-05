document.addEventListener('DOMContentLoaded', async () => {
    const sessionSelect = document.getElementById('sessionSelect');
    const sessionContent = document.getElementById('sessionContent');

    const { sessions } = await chrome.storage.local.get(['sessions']);
    const sessionNames = Object.keys(sessions || {});

    sessionNames.forEach(sessionName => {
        const option = document.createElement('option');
        option.value = sessionName;
        option.textContent = sessionName;
        sessionSelect.appendChild(option);
    });

    sessionSelect.addEventListener('change', () => {
        const selectedSession = sessionSelect.value;
        displaySessionContent(selectedSession);
    });

    function displaySessionContent(sessionName) {
        sessionContent.innerHTML = '';
        const contentList = sessions[sessionName] || [];
        contentList.forEach((content, index) => {
            const contentItem = document.createElement('div');
            contentItem.className = 'session-item';
            contentItem.textContent = content;

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.className = 'delete-btn';
            deleteBtn.addEventListener('click', async () => {
                contentList.splice(index, 1);
                await chrome.storage.local.set({ sessions });
                displaySessionContent(sessionName);
            });

            contentItem.appendChild(deleteBtn);
            sessionContent.appendChild(contentItem);
        });
    }

    if (sessionNames.length > 0) {
        displaySessionContent(sessionNames[0]);
    }

    document.getElementById('newSession').addEventListener('click', async () => {
        const sessionName = prompt('请输入新的会话名称：');
        if (sessionName && !sessions[sessionName]) {
            sessions[sessionName] = [];
            await chrome.storage.local.set({ sessions });
            
            const option = document.createElement('option');
            option.value = sessionName;
            option.textContent = sessionName;
            sessionSelect.appendChild(option);
            
            sessionSelect.value = sessionName;
            displaySessionContent(sessionName);
        } else if (sessions[sessionName]) {
            alert('该会话名称已存在！');
        }
    });

    document.getElementById('deleteSession').addEventListener('click', async () => {
        const selectedSession = sessionSelect.value;
        // 不允许删除default会话
        if (selectedSession === 'default') {
            alert('不允许删除默认会话！');
            return;
        }
        
        if (selectedSession && confirm(`确定要删除会话 "${selectedSession}" 吗？`)) {
            delete sessions[selectedSession];
            await chrome.storage.local.set({ sessions });
            
            sessionSelect.remove(sessionSelect.selectedIndex);
            
            if (sessionSelect.options.length > 0) {
                displaySessionContent(sessionSelect.options[0].value);
            } else {
                sessionContent.innerHTML = '';
            }
        }
    });

    document.getElementById('renameSession').addEventListener('click', async () => {
        const selectedSession = sessionSelect.value;
        // 不允许重命名default会话
        if (selectedSession === 'default') {
            alert('不允许重命名默认会话！');
            return;
        }
        
        const newName = prompt('请输入新的会话名称：', selectedSession);
        
        if (newName && newName !== selectedSession && !sessions[newName]) {
            sessions[newName] = sessions[selectedSession];
            delete sessions[selectedSession];
            await chrome.storage.local.set({ sessions });
            
            const selectedOption = sessionSelect.options[sessionSelect.selectedIndex];
            selectedOption.value = newName;
            selectedOption.textContent = newName;
            
            displaySessionContent(newName);
        } else if (sessions[newName]) {
            alert('该会话名称已存在！');
        }
    });
});
  