let voiceTargetInputId = 'searchInput';
let recorder;
let microphone;

import { CONFIG } from './config.js';
const SPEECH_API_URL = CONFIG.SPEECH_ENDPOINT; // 改用 config 的動態設定

/**
 * 啟動語音辨識與錄音 / Start voice search recording
 * @param {string} targetId - 接收語音結果的輸入框 ID / Input field ID to receive the transcription
 */
export async function startVoiceSearch(targetId) {
    voiceTargetInputId = targetId;
    const overlay = document.getElementById('voiceOverlay');
    const transcript = document.getElementById('speechTranscript');
    const doneBtn = document.getElementById('voiceDoneBtn');
    const cancelBtn = document.getElementById('voiceCancelBtn');
    
    // 若在快速搜尋內觸發語音，先關閉原視窗 / Close quick search modal if voice is triggered from there
    if(targetId === 'quickSearchInput') window.closeQuickSearch();
    
    overlay.classList.remove('hidden');
    transcript.innerText = "正在連接麥克風...";
    doneBtn.classList.add('hidden');
    cancelBtn.classList.remove('hidden');

    try {
        // 要求麥克風權限 / Request microphone permissions
        microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        // 使用 RecordRTC 錄製 WAV 格式 (設定為 Azure Speech SDK 喜好的 16kHz, 單聲道)
        // Record as WAV (16kHz, Mono) for Azure Speech SDK compatibility
        recorder = RecordRTC(microphone, {
            type: 'audio',
            mimeType: 'audio/wav',
            recorderType: StereoAudioRecorder,
            numberOfAudioChannels: 1,
            desiredSampRate: 16000
        });

        recorder.startRecording();
        transcript.innerText = "請說出您想尋找的商店...";
        doneBtn.classList.remove('hidden'); // 顯示「說完了」按鈕 / Show "Done" button
        
    } catch (error) {
        console.error("麥克風存取失敗:", error);
        transcript.innerText = "無法存取麥克風，請確認瀏覽器權限設定。";
        setTimeout(closeVoiceSearch, 3000);
    }
}

/**
 * 完成錄音並發送至 API 辨識 / Stop recording and send to API for transcription
 */
export async function finishVoiceSearch() {
    const transcript = document.getElementById('speechTranscript');
    const doneBtn = document.getElementById('voiceDoneBtn');
    const cancelBtn = document.getElementById('voiceCancelBtn');
    
    if (!recorder) return;

    transcript.innerText = "正在將語音傳送至 Azure 辨識中，請稍候...";
    doneBtn.classList.add('hidden');
    cancelBtn.classList.add('hidden');

    recorder.stopRecording(async function() {
        const audioBlob = recorder.getBlob();
        
        // 釋放麥克風資源 / Release microphone resources
        if (microphone) {
            microphone.getTracks().forEach(track => track.stop());
        }

        try {
            // 發送 POST 請求將 WAV 檔傳送給 Azure Function
            // Send POST request with WAV file to Azure Function
            const response = await fetch(SPEECH_API_URL, {
                method: 'POST',
                body: audioBlob,
                headers: {
                    'Content-Type': 'audio/wav'
                }
            });

            if (!response.ok) {
                throw new Error(`伺服器錯誤: ${response.status}`);
            }

            const resultText = await response.text();
            
            if (resultText && resultText.trim() !== '') {
                // 移除標點符號以方便搜尋 / Remove punctuation for better search
                const cleanText = resultText.replace(/[。，！？]/g, '');
                transcript.innerText = `「${cleanText}」`;
                
                setTimeout(() => {
                    closeVoiceSearch();
                    const inputField = document.getElementById(voiceTargetInputId);
                    inputField.value = cleanText;
                    
                    // 觸發搜尋 / Trigger search event
                    if (voiceTargetInputId === 'searchInput') {
                        inputField.dispatchEvent(new Event('input')); 
                    } else {
                        window.executeQuickSearch();
                    }
                }, 1000);
            } else {
                transcript.innerText = "未能辨識到明確的語音，請重試。";
                setTimeout(closeVoiceSearch, 2000);
            }
            
        } catch (error) {
            console.error("語音辨識 API 發生錯誤:", error);
            transcript.innerText = "語音辨識連線失敗，請檢查網路或後端伺服器。";
            setTimeout(closeVoiceSearch, 3000);
        }
    });
}

/**
 * 關閉語音搜尋介面與資源 / Close voice search overlay and clear resources
 */
export function closeVoiceSearch() {
    if (recorder) {
        recorder.destroy();
        recorder = null;
    }
    if (microphone) {
        microphone.getTracks().forEach(track => track.stop());
        microphone = null;
    }
    document.getElementById('voiceOverlay').classList.add('hidden');
}

/**
 * 透過瀏覽器原生語音引擎朗讀文字 / Read store info using browser's built-in Text-to-Speech
 * @param {string} name - 店名 / Store Name
 * @param {string} category - 類別 / Category
 * @param {string} address - 地址 / Address
 * @param {string} phone - 電話 / Phone Number
 */
export function speakText(name, category, address, phone) {
    if (!('speechSynthesis' in window)) {
        alert("您的瀏覽器不支援語音朗讀功能。 / Your browser does not support Speech Synthesis.");
        return;
    }
    // 中斷正在進行的朗讀 / Cancel ongoing speech
    window.speechSynthesis.cancel();

    // 將電話號碼打散並用空白連接，強制語音引擎逐字朗讀 / Split phone number for digit-by-digit reading
    const spokenPhone = phone.replace(/-/g, ' ').split('').join(' ');
    const textToRead = `店名：${name}。類別：${category}。地址：${address}。電話：${spokenPhone}。`;
    
    // 建立語音實例 / Create speech synthesis utterance
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.lang = 'zh-TW';
    
    // 顯示提示 Toast / Show status toast
    const toast = document.getElementById('ttsStatus');
    toast.style.opacity = '1';

    utterance.onend = function() { toast.style.opacity = '0'; };
    utterance.onerror = function() { toast.style.opacity = '0'; };

    window.speechSynthesis.speak(utterance);
}