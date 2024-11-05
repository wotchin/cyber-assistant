document.addEventListener('DOMContentLoaded', async () => {
    const { apiKey } = await chrome.storage.local.get(['apiKey']);
    if (apiKey) {
        document.getElementById('apiKey').value = apiKey;
    }

    document.getElementById('saveSettings').addEventListener('click', async () => {
        const apiKey = document.getElementById('apiKey').value;
        await chrome.storage.local.set({ apiKey });
        notify('Success', 'Settings saved!');
    });
}); 