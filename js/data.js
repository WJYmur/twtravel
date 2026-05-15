// 預設分類列表 / Default category list
export const defaultCategories = [
    '全部', 
    '交通與汽機車', 
    '住宿與旅遊', 
    '餐飲與特產', 
    '綜合百貨量販', 
    '服飾與體育配件', 
    '醫療保健與美容', 
    '藝文與休閒娛樂', 
    '商圈與綜合服務'
];

// 分類對應的本地圖片路徑 / Local image paths for categories
const categoryImages = {
    '交通與汽機車': './img/transportation.png',
    '住宿與旅遊': './img/accommodation.png',
    '餐飲與特產': './img/dining.png',
    '綜合百貨量販': './img/department.png',
    '服飾與體育配件': './img/clothing.png',
    '醫療保健與美容': './img/healthcare.png',
    '藝文與休閒娛樂': './img/entertainment.png',
    '商圈與綜合服務': './img/commercial.png',
    'default': './img/default.png' // 預設圖片防呆機制 / Fallback default image
};

// Azure Functions 本地測試 API 端點 / Local Azure Functions API Endpoint
const API_URL = 'http://localhost:7071/api/tw_search';

/**
 * 從 API 取得商店資料 / Fetch store data from API
 * @param {Object} params - 包含縣市、關鍵字、分類與頁碼的參數 / Parameters including county, keyword, category, and page
 * @returns {Promise<Object>} 處理後的商店資料物件 / Processed store data object
 */
export async function fetchStoresAPI({ county = '', keyword = '', category = '全部', page = 1 }) {
    try {
        const url = new URL(API_URL);
        
        // 建立 Query String / Build query string
        if (county && county !== '全台') url.searchParams.append('county', county);
        if (keyword) url.searchParams.append('keyword', keyword);
        if (category && category !== '全部') url.searchParams.append('category', category);
        url.searchParams.append('page', page);
        url.searchParams.append('limit', 10);

        const response = await fetch(url.toString());
        if (!response.ok) throw new Error(`API 請求失敗: ${response.status}`);
        
        const result = await response.json();
        
        // 確保資料格式相容 / Ensure data format compatibility
        const dataList = Array.isArray(result) ? result : (result.data || []);
        const total = result.total || dataList.length;

        // 資料清理與對齊 / Data normalization and mapping
        const processedData = dataList.map((d, index) => {
            const storeName = d.name || d.Name || d.storeName || '';
            const catStr = d.cat || d.category || d.Category || '';
            
            // 取得對應圖片，找不到則使用預設圖 / Get mapped image or use default
            const imgPath = categoryImages[catStr] || categoryImages['default'];

            return {
                id: `store_${page}_${index}`,
                name: storeName,
                county: d.county || county,
                cat: catStr,
                addr: d.addr || d.address || d.Address || '無地址',
                phone: d.phone || d.tel || d.Phone || '無提供',
                hours: d.hours || d.Hours || '營業時間依店家公告',
                img: imgPath 
            };
        });

        return {
            total: total,
            page: page,
            limit: 10,
            data: processedData
        };

    } catch (error) {
        console.error('取得 API 資料發生錯誤:', error);
        return { total: 0, page: 1, limit: 10, data: [] };
    }
}