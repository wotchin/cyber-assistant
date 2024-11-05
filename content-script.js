// 创建和初始化侧边栏iframe
let sidePanel = null;

function createSidePanel() {
  sidePanel = document.createElement('iframe');
  sidePanel.src = chrome.runtime.getURL('popup.html');
  sidePanel.id = 'extension-sidepanel';
  sidePanel.style.cssText = `
    position: fixed;
    top: 0;
    right: -400px;
    width: 400px;
    height: 100vh;
    border: none;
    box-shadow: -2px 0 5px rgba(0,0,0,0.1);
    transition: right 0.3s ease;
    z-index: 2147483647;
  `;
  document.body.appendChild(sidePanel);
}

// 监听来自background的消息
chrome.runtime.onMessage.addListener((msg, sender) => {
  if (msg === "toggle") {
    togglePanel();
  }
});

// 切换面板显示/隐藏
function togglePanel() {
  if (!sidePanel) {
    createSidePanel();
  }
  
  if (sidePanel.style.right === '0px') {
    sidePanel.style.right = '-400px';
  } else {
    sidePanel.style.right = '0px';
  }
}

// 初始化创建面板
createSidePanel(); 