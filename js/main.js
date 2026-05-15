import { initTaiwanMap } from './map.js';
import { initSearch, renderSearchPage, renderGlobalSearchPage } from './search.js';
import { startVoiceSearch, closeVoiceSearch, finishVoiceSearch, speakText } from './utils.js';

// 初始化應用程式 / Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    initTaiwanMap();
    initSearch();
    handleRouting(); 

    // 監聽滾動事件以顯示或隱藏「回到最上方」按鈕 / Toggle "Back to Top" button on scroll
    window.addEventListener('scroll', () => {
        const backToTopBtn = document.getElementById('backToTopBtn');
        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
            backToTopBtn.classList.add('opacity-100', 'pointer-events-auto');
        } else {
            backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
            backToTopBtn.classList.remove('opacity-100', 'pointer-events-auto');
        }
    });
});

// 監聽 Hash 路由變更 / Listen for hash route changes
window.addEventListener('hashchange', handleRouting);

/**
 * 處理 SPA 路由切換 / Handle Single Page Application routing
 */
function handleRouting() {
    const hash = decodeURIComponent(window.location.hash);
    
    if (hash.startsWith('#/search')) {
        const urlParams = new URLSearchParams(hash.split('?')[1]);
        const countyName = urlParams.get('county');
        const searchQuery = urlParams.get('q');
        
        // 切換至搜尋視圖 / Switch to search view
        document.getElementById('mapView').classList.add('hidden');
        document.getElementById('queryView').classList.remove('hidden');
        document.getElementById('nav-map').classList.replace('text-blue-600', 'text-gray-400');
        document.getElementById('nav-search').classList.replace('text-gray-400', 'text-blue-600');
        
        if (countyName) {
            renderSearchPage(countyName);
        } else if (searchQuery) {
            renderGlobalSearchPage(searchQuery);
        }
        window.scrollTo(0, 0);
    } else {
        showMap();
    }
}

// 導航與視圖切換函數 / Navigation and view toggle functions
function navigateToSearch(countyName) { window.location.hash = `#/search?county=${countyName}`; }
function showMap() {
    // 清除路由狀態 / Clear route state
    window.history.pushState("", document.title, window.location.pathname + window.location.search);
    document.getElementById('queryView').classList.add('hidden');
    document.getElementById('mapView').classList.remove('hidden');
    document.getElementById('nav-map').classList.replace('text-gray-400', 'text-blue-600');
    document.getElementById('nav-search').classList.replace('text-blue-600', 'text-gray-400');
    window.scrollTo(0,0);
}

// 快速搜尋 Modal 控制 / Quick search modal controls
function openQuickSearch() {
    const modal = document.getElementById('quickSearchModal');
    modal.classList.remove('hidden');
    document.getElementById('quickSearchInput').value = '';
    setTimeout(() => document.getElementById('quickSearchInput').focus(), 100);
}

function closeQuickSearch() {
    document.getElementById('quickSearchModal').classList.add('hidden');
}

function executeQuickSearch() {
    const query = document.getElementById('quickSearchInput').value.trim();
    closeQuickSearch();
    window.location.hash = `#/search?q=${encodeURIComponent(query)}`;
}

// ==================== Google Map Modal 邏輯 / Google Map Modal Logic ====================
function openMapModal(name, addr) {
    const modal = document.getElementById('mapModal');
    const iframe = document.getElementById('googleMapIframe');
    const title = document.getElementById('mapModalTitle');
    const loading = document.getElementById('mapIframeLoading');
    const addrText = document.getElementById('mapModalAddr');

    if (!modal) return console.error("找不到地圖 Modal 元素，請確認 HTML 已更新！");

    title.innerText = name;
    addrText.innerHTML = `<i class="fas fa-map-marker-alt text-red-500 mr-1.5"></i>${addr}`;
    
    // 🌟 修正：使用標準的 Google Maps Embed 網址格式
    const encodedQ = encodeURIComponent(`${name} ${addr}`);
    const mapUrl = `https://maps.google.com/maps?q=${encodedQ}&hl=zh-TW&z=16&output=embed`;
    
    loading.classList.remove('hidden');
    iframe.src = mapUrl;
    modal.classList.remove('hidden');

    // 監聽 iframe 載入完成
    iframe.onload = () => {
        loading.classList.add('hidden');
    };
}

function closeMapModal() {
    const modal = document.getElementById('mapModal');
    const iframe = document.getElementById('googleMapIframe');
    modal.classList.add('hidden');
    iframe.src = ""; // 清空 src 以停止背景載入 / Clear src to stop background loading
}

// 將函數綁定到 window 全域物件，供 HTML 呼叫 / Bind functions to window object for HTML inline handlers
window.navigateToSearch = navigateToSearch;
window.showMap = showMap;
window.startVoiceSearch = startVoiceSearch;
window.closeVoiceSearch = closeVoiceSearch;
window.finishVoiceSearch = finishVoiceSearch;
window.speakText = speakText;
window.openQuickSearch = openQuickSearch;
window.closeQuickSearch = closeQuickSearch;
window.executeQuickSearch = executeQuickSearch;
window.openMapModal = openMapModal; 
window.closeMapModal = closeMapModal;