document.addEventListener('DOMContentLoaded', async () => {
    const apiKeyInput = document.getElementById('apiKey');
    const saveButton = document.getElementById('saveSettings');
    const statusMessage = document.getElementById('statusMessage');

    // 加载已保存的API key
    const { apiKey } = await chrome.storage.local.get(['apiKey']);
    if (apiKey) {
        apiKeyInput.value = apiKey;
    }

    function showStatus(message, isError = false) {
        statusMessage.textContent = message;
        statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
        statusMessage.style.display = 'block';
        setTimeout(() => {
            statusMessage.style.display = 'none';
        }, 3000);
    }

    saveButton.addEventListener('click', async () => {
        const newApiKey = apiKeyInput.value.trim();
        
        if (!newApiKey) {
            showStatus('Please enter an API key', true);
            return;
        }

        try {
            await chrome.storage.local.set({ apiKey: newApiKey });
            showStatus('Settings saved successfully!');
        } catch (error) {
            showStatus('Error saving settings: ' + error.message, true);
        }
    });
}); 