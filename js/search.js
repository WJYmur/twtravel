import { fetchStoresAPI, defaultCategories } from './data.js';

// 搜尋狀態管理 / Search state management
let currentCounty = '';
let currentCategory = '全部';
let currentKeyword = '';
let currentPage = 1;
let isFetching = false;
let hasMore = true;
let totalDisplayed = 0;

/**
 * 初始化搜尋模組事件監聽 / Initialize search module event listeners
 */
export function initSearch() {
    let debounceTimer;
    // 搜尋框防抖輸入處理 / Debounced input handling for search box
    document.getElementById('searchInput').addEventListener('input', (e) => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            currentKeyword = e.target.value.trim().replace(/\s+/g, ' ');
            triggerNewSearch();
        }, 600); 
    });
    
    document.getElementById('load-more-btn').addEventListener('click', () => loadMoreItems(false));
    
    renderCategoryTags(); 
}

/**
 * 渲染分類標籤按鈕 / Render category tag buttons
 */
function renderCategoryTags() {
    const container = document.getElementById('category-tags-container');
    
    container.innerHTML = defaultCategories.map(cat => {
        return `<button data-cat="${cat}" class="category-btn px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600">${cat}</button>`;
    }).join('');

    // 綁定點擊事件切換分類 / Bind click events to switch categories
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            currentCategory = e.target.getAttribute('data-cat');
            updateCategoryUI();
            triggerNewSearch();
        });
    });
    updateCategoryUI();
}

/**
 * 更新分類按鈕視覺狀態 / Update visual state of category buttons
 */
function updateCategoryUI() {
    document.querySelectorAll('.category-btn').forEach(btn => {
        const cat = btn.getAttribute('data-cat');
        if (cat === currentCategory) {
            btn.className = "category-btn px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition bg-blue-600 text-white shadow-sm";
        } else {
            btn.className = "category-btn px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition bg-gray-100 text-gray-600 hover:bg-blue-100 hover:text-blue-600";
        }
    });
}

/**
 * 渲染特定縣市搜尋頁面 / Render search page for specific county
 */
export function renderSearchPage(countyName) {
    currentCounty = countyName.replace(/臺/g, '台');
    currentCategory = '全部';
    currentKeyword = '';
    
    document.getElementById('selected-county-title').innerHTML = `<i class="fas fa-store mr-2"></i> ${countyName} 特約商店`;
    document.getElementById('searchInput').value = '';
    
    updateCategoryUI();
    triggerNewSearch();
}

/**
 * 渲染全域搜尋頁面 / Render global search page
 */
export function renderGlobalSearchPage(query) {
    currentCounty = '全台';
    currentCategory = '全部';
    currentKeyword = query.trim().replace(/\s+/g, ' ');

    document.getElementById('selected-county-title').innerHTML = `<i class="fas fa-globe mr-2"></i> 全台搜尋結果`;
    document.getElementById('searchInput').value = currentKeyword;

    updateCategoryUI();
    triggerNewSearch();
}

/**
 * 重置分頁並觸發全新搜尋 / Reset pagination and trigger a fresh search
 */
async function triggerNewSearch() {
    currentPage = 1;
    hasMore = true;
    totalDisplayed = 0;
    
    // 更新查詢提示文字 / Update query hint text
    let hintText = currentCounty;
    if (currentKeyword) {
        hintText += ` (包含: ${currentKeyword})`;
    }
    document.getElementById('hintCity').innerText = hintText;
    
    const container = document.getElementById('store-list-container');
    container.innerHTML = `
        <div class="col-span-1 md:col-span-2 text-center py-10 text-blue-500">
            <i class="fas fa-spinner fa-spin text-4xl mb-3"></i>
            <p>連線至 API 伺服器載入資料中...</p>
        </div>
    `;
    
    document.getElementById('total-count').innerText = `搜尋中...`;
    document.getElementById('load-more-container').classList.add('hidden');
    
    await loadMoreItems(true);
}

/**
 * 載入更多項目 (或首次搜尋) / Load more items (or initial search)
 * @param {boolean} isNewSearch - 是否為全新搜尋 / Whether it's a new search
 */
async function loadMoreItems(isNewSearch = false) {
    if (isFetching || !hasMore) return;
    isFetching = true;

    const btn = document.getElementById('load-more-btn');
    const originalText = btn.innerHTML;
    if (!isNewSearch) {
        btn.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i> 載入中...`;
    }

    const result = await fetchStoresAPI({
        county: currentCounty,
        category: currentCategory,
        keyword: currentKeyword,
        page: currentPage
    });

    isFetching = false;
    btn.innerHTML = originalText;

    const container = document.getElementById('store-list-container');
    if (isNewSearch) container.innerHTML = '';

    // 無結果處理 / Handle no results
    if (currentPage === 1 && result.data.length === 0) {
        container.innerHTML = `
            <div class="col-span-1 md:col-span-2 text-center py-16">
                <i class="fas fa-search-minus text-6xl text-gray-300 mb-5"></i>
                <h3 class="text-xl font-bold text-gray-700 mb-2">找不到符合條件的商店</h3>
                <p class="text-gray-500">請嘗試使用其他關鍵字或變更分類</p>
            </div>
        `;
        document.getElementById('total-count').innerText = `共 0 筆`;
        hasMore = false;
        return;
    }

    renderStoreCards(result.data, container);
    totalDisplayed += result.data.length;
    document.getElementById('total-count').innerText = `已載入 ${totalDisplayed} / 共 ${result.total} 筆`;

    // 檢查是否還有更多資料 / Check if there are more items to load
    if (result.data.length < 10 || totalDisplayed >= result.total) {
        hasMore = false;
        document.getElementById('load-more-container').classList.add('hidden');
    } else {
        currentPage++;
        document.getElementById('load-more-container').classList.remove('hidden');
    }
}

/**
 * 生成並渲染商店卡片 / Generate and render store cards
 */
function renderStoreCards(stores, container) {
    stores.forEach(store => {
        const card = document.createElement('div');
        card.className = "bg-white rounded-2xl shadow-sm hover:shadow-lg transition duration-300 overflow-hidden border border-gray-100 flex flex-col group";
        
        let badgeColor = 'bg-blue-100 text-blue-700'; 
        if (store.cat.includes('交通')) badgeColor = 'bg-slate-100 text-slate-700';
        else if (store.cat.includes('住宿') || store.cat.includes('旅遊')) badgeColor = 'bg-orange-100 text-orange-700';
        else if (store.cat.includes('餐飲') || store.cat.includes('特產')) badgeColor = 'bg-red-100 text-red-700';
        else if (store.cat.includes('綜合百貨')) badgeColor = 'bg-indigo-100 text-indigo-700';
        else if (store.cat.includes('服飾') || store.cat.includes('體育')) badgeColor = 'bg-purple-100 text-purple-700';
        else if (store.cat.includes('醫療') || store.cat.includes('美容')) badgeColor = 'bg-pink-100 text-pink-700';
        else if (store.cat.includes('藝文') || store.cat.includes('休閒')) badgeColor = 'bg-yellow-100 text-yellow-700';
        else if (store.cat.includes('商圈') || store.cat.includes('服務')) badgeColor = 'bg-emerald-100 text-emerald-700';

        // 🌟 修復 Bug: 使用 Google Maps 路線規劃 API，不指定起點，會自動以使用者「目前位置」開始導航
        const navUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(store.name + ' ' + store.addr)}`;

        card.innerHTML = `
            <div class="h-48 bg-gray-200 relative overflow-hidden">
                <img src="${store.img}" alt="${store.name}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500">
                <span class="absolute top-3 right-3 bg-green-500 text-white text-xs px-2.5 py-1 rounded-md font-bold shadow-md">
                    <i class="fas fa-check-circle mr-1"></i>國旅特約
                </span>
                <button onclick="window.openMapModal('${store.name}', '${store.addr}')" class="absolute bottom-3 right-3 bg-white/90 backdrop-blur hover:bg-white text-gray-800 text-xs px-3 py-1.5 rounded-full font-bold shadow-lg transition-all transform translate-y-12 group-hover:translate-y-0 flex items-center">
                    <i class="fas fa-location-dot text-red-500 mr-1.5"></i>查看地圖
                </button>
            </div>
            <div class="p-5 flex-1 flex flex-col">
                <div class="flex justify-between items-start mb-3 gap-2">
                    <h2 class="text-xl font-bold text-gray-800 leading-tight">${store.name}</h2>
                    <span class="${badgeColor} border border-transparent text-xs px-2.5 py-1 rounded-full whitespace-nowrap ml-2 font-medium shrink-0">${store.cat}</span>
                </div>
                <div class="space-y-3 mb-5 flex-1">
                    <div class="text-gray-600 text-sm flex items-start justify-between">
                        <div class="flex items-start pr-2">
                            <i class="fas fa-map-marker-alt w-5 text-red-400 mt-1 shrink-0"></i>
                            <span>${store.addr}</span>
                        </div>
                        <a href="${navUrl}" target="_blank" rel="noopener noreferrer" class="shrink-0 bg-blue-50 hover:bg-blue-100 text-blue-600 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center border border-blue-100 hover:border-blue-300 shadow-sm">
                            <i class="fas fa-directions mr-1"></i>導航
                        </a>
                    </div>
                    <p class="text-gray-600 text-sm flex items-center">
                        <i class="fas fa-clock w-5 text-yellow-500"></i>
                        <span>營業時間：${store.hours}</span>
                    </p>
                    <p class="text-gray-600 text-sm flex items-center">
                        <i class="fas fa-phone-alt w-5 text-blue-400"></i>
                        <span class="font-medium">${store.phone}</span>
                    </p>
                </div>
                <div class="flex space-x-3 mt-auto border-t border-gray-100 pt-4">
                    <button onclick="window.speakText('${store.name}', '${store.cat}', '${store.addr}', '${store.phone}')" class="flex-1 bg-blue-50 hover:bg-blue-600 hover:text-white text-blue-600 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center justify-center border border-blue-100 hover:border-transparent">
                        <i class="fas fa-volume-up mr-2"></i> 朗讀資訊
                    </button>
                    <a href="tel:${store.phone}" class="bg-green-50 hover:bg-green-500 hover:text-white text-green-600 px-5 py-2.5 rounded-xl font-bold transition-colors flex items-center border border-green-100 hover:border-transparent">
                        <i class="fas fa-phone-alt"></i>
                    </a>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}