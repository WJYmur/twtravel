# tw_travel
Taiwan 國旅卡特約商店視覺化查詢系統

這是一個專為台灣「國民旅遊卡」特約商店設計的極速查詢系統。採用靜態記憶體快取技術，提供毫秒級的檢索體驗。系統內建AI語音辨識與文字朗讀功能，並具備完美適配手機與桌機的現代化RWD介面。

    # 系統架構
    [ 客戶端 Browser ]
       ├── UI: Tailwind + HTML
       ├── 邏輯: ES6 模組 (main.js, search.js, map.js)
       └── 硬體調用: 麥克風 (WAV 錄音) -> 發送至 Azure 進行 STT
              │
          (HTTP GET / POST)
              ▼
    [ 雲端 Azure Serverless ]
       ├── API 1: 商店檢索 (Python) -> 讀取記憶體快取 JSON -> 條件過濾 & 分頁回傳
       └── API 2: 語音辨識 (Python) -> 接收 WAV -> 調用 Azure Speech SDK -> 回傳文字
    

## 步驟

1. **在 Azure 上建立資源群組**

    在 Azure 上建立一個資源群組，名稱為 `twpapago`。

2. **建立Microsoft Foundry - 語音服務**

    在 Azure 上建立一個Microsoft Foundry - 語音服務。確保定價層選擇為 Free F0。

3. **輸入端點和金鑰**

    從 Azure 取得語音服務的`端點`和`金鑰`。

4. **構建 Docker 映像檔**

    在本地端運行以下指令，建立 Docker 映像檔：

    ```bash
    docker build -t my-flask-app .
    ```

5. **在本地端運行 Docker 容器**

    在本地端運行以下指令，啟動 Docker 容器：

    ```bash
    docker run -p 8080:8080 my-flask-app
    ```

6. **測試成功後結束**

    測試應用程式是否成功運行，並確保功能正常。

7. **登入 Azure**

    在命令列中使用以下指令登入 Azure：

    ```bash
    az login
    ```

8. **建立 Azure 容器註冊表**

    使用以下指令在 Azure 上建立容器註冊表：

    ```bash
    az acr create --resource-group textanalysis --name finalregistry10317 --sku Basic
    ```

9. **登入 Azure 容器註冊表**

    使用以下指令登入剛剛建立的 Azure 容器註冊表：

    ```bash
    az acr login --name finalregistry10317
    ```

10. **標記 Docker 映像檔**

    使用以下指令標記 Docker 映像檔：

    ```bash
    docker tag my-flask-app finalregistry10317.azurecr.io/my-flask-app:v1
    ```

11. **推送 Docker 映像檔到 Azure 容器註冊表**

    使用以下指令推送 Docker 映像檔到 Azure 容器註冊表：

    ```bash
    docker push finalregistry10317.azurecr.io/my-flask-app:v1
    ```

12. **建立容器執行個體**

    在 Azure 頁面中，找到剛剛建立的容器註冊表，並建立一個容器執行個體。

13. **設定容器執行個體**

    在容器執行個體的設定中，確保新增了 8080 port，以便能夠訪問 Flask 應用程式。

14. **執行**

    完成上述步驟後，你的 Flask 應用程式應該已經在 Azure 上運行。你可以通過瀏覽器訪問該應用程式的 URL，並開始使用文字分析功能。
