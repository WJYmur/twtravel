/**
 * 環境配置管理 / Environment Configuration Management
 */
const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

export const CONFIG = {
    IS_LOCAL: isLocal,

    // 商店搜尋 API 路徑
    // 本地端連到 7071，生產環境統一由 Nginx 代理 /api/tw_search
    SEARCH_ENDPOINT: isLocal 
        ? 'http://localhost:7071/api/tw_search' 
        : '/api/tw_search',

    // 語音辨識 API 路徑
    // 本地端連到 7072，生產環境統一由 Nginx 代理 /api/speech_to_text
    SPEECH_ENDPOINT: isLocal 
        ? 'http://localhost:7072/api/speech_to_text' 
        : '/api/speech_to_text'
};