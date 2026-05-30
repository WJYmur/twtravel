# twtravel - 國旅特約商店查詢系統 (Frontend)

本專案為系統的使用者介面 (UI)。採用 Vanilla JavaScript 與 Tailwind CSS 打造，整合 D3.js 互動地圖與語音錄製功能，並透過 Docker 容器化部署至 Azure Container Instances。

## ✨ 核心功能
**互動地圖**：視覺化的全台縣市快速選擇 (D3.js)。
* **語音查詢**：透過麥克風錄音並呼叫後端 API，將語音轉換為文字後同步觸發搜尋。
* **店家資訊卡片**：顯示特約商店類別、地址、營業時間，並整合 Google 導航與語音朗讀功能。

## 📁 檔案結構
* `index.html`：系統主畫面介面。
* `js/config.js`：環境配置管理 (API 路由設定)。
* `js/data.js`：資料對接與清理中心。
* `js/main.js`：全域主控與路由中心。
* `js/map.js`：互動地圖模組。
* `js/search.js`：搜尋狀態與 UI 渲染模組。
* `js/utils.js`：智慧語音與無障礙工具模組。
* `img/`：分類預設圖片資料夾。
* `default.conf.template`：Nginx 設定樣板檔。
* `Dockerfile`：自動化建構 Docker 映像檔。

## 🚀 安裝與執行流程
1. **建立 Docker 映像檔**：於專案根目錄執行
```bash
   docker build -t twtravel .
```
2. **本地測試運行**：
```bash
   docker run -d -p 8080:80 --name twtravel \
   -e SEARCH_API_URL="您的 twsearch API URL" \
   -e SPEECH_API_URL="您的 twspeech API URL" \
   twtravel
```

3. **部署至 Azure**：
* 登入 Azure Container Registries (ACR)。
* 標記並推送映像檔：
```bash
   docker image build -t <您的ACR名稱>.azurecr.io/twtravel:dockerfile .
   docker login <您的ACR名稱>.azurecr.io
   docker push <您的ACR名稱>.azurecr.io/twtravel:dockerfile
```
* 建立 Azure 容器執行個體 (ACI)，選擇剛上傳的映像檔，並在環境變數中設定 SEARCH_API_URL 與 SPEECH_API_URL。

## ⚠️ 注意事項 (Chrome 麥克風權限問題)
* 由於部署後的 ACI 預設為 HTTP 連線，基於安全性考量，Google Chrome 預設會禁止 HTTP 網頁使用麥克風。測試時請開啟 Chrome 實驗性功能：
* 網址列輸入 chrome://flags/#unsafely-treat-insecure-origin-as-secure。
* 填入您的網站 URL (例：http://您的IP/)，並將選項設為 Enabled。
* 重新啟動瀏覽器並允許麥克風權限。
