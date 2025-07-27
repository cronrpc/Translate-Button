// ==UserScript==
// @name         Translate Button (Ollama API)
// @namespace    https://github.com/cronrpc/Translate-Local-Tampermonkey
// @version      1.1.0
// @description  A script that adds a translation button to selected text (uses local Ollama HTTP API).
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    /* -------- 可自定义的设置 -------- */
    const OLLAMA_ENDPOINT = 'http://localhost:11434/api/generate'; // 本地 Ollama API
    const OLLAMA_MODEL   = GM_getValue('ollamaModel', 'llama3');   // 默认模型，可在下方菜单里改
    const MAX_TOKENS     = 150;                                    // 对应 Ollama 的 num_predict

    /* -------- 目标语言菜单 -------- */
    const targetLanguageList = ['Chinese', 'English', 'Japanese'];
    let targetTranslateLanguage = GM_getValue('targetTranslateLanguage', 'Chinese');

    targetLanguageList.forEach(language => {
        GM_registerMenuCommand(`Target: ${language}`, () => {
            alert(`Target language set to ${language}`);
            targetTranslateLanguage = language;
            GM_setValue('targetTranslateLanguage', language);
        });
    });

    /* -------- 模型选择菜单（可选） -------- */
    const modelList = ['qwen2.5:14b', 'mistral:7b', 'gemma3n:latest'];
    modelList.forEach(m => {
        GM_registerMenuCommand(`Model: ${m}`, () => {
            alert(`Ollama model set to ${m}`);
            GM_setValue('ollamaModel', m);
            location.reload();   // 重新载入脚本以生效
        });
    });

    /* -------- 样式 -------- */
    GM_addStyle(`
        #sendButton {
            position: absolute;
            display: none;
            background-color: #007bff;
            color: white;
            border: none;
            border-radius: 10px;
            padding: 10px 15px;
            font-size: 14px;
            cursor: pointer;
            z-index: 10000;
        }
        #sendButton:hover { background-color: #0056b3; }
        #resultBox {
            position: absolute;
            display: none;
            background-color: #ffffff;
            color: #000000;
            border: 1px solid #ccc;
            border-radius: 10px;
            padding: 10px;
            font-size: 14px;
            width: 300px;
            box-shadow: 0 2px 10px rgba(0,0,0,.2);
            z-index: 10001;
            white-space: pre-wrap;
        }
    `);

    /* -------- 创建按钮与结果框 -------- */
    const button    = Object.assign(document.createElement('button'), { id: 'sendButton', innerText: 'Translate' });
    const resultBox = Object.assign(document.createElement('div'),    { id: 'resultBox' });
    document.body.append(button, resultBox);

    let lastSelectedText = '';

    /* -------- 选中文本时显示按钮 -------- */
    document.addEventListener('mouseup', e => {
        const selection    = window.getSelection();
        const selectedText = selection.toString().trim();

        if (selectedText && selectedText !== lastSelectedText &&
            !button.contains(e.target) && !resultBox.contains(e.target)) {
            button.style.top      = `${window.scrollY + e.clientY - button.offsetHeight - 5}px`;
            button.style.left     = `${window.scrollX + e.clientX}px`;
            button.style.display  = 'block';
            button.dataset.text   = selectedText;
        } else if (!selectedText) {
            button.style.display  = 'none';
            resultBox.style.display = 'none';
        }
        lastSelectedText = selectedText;
    });

    /* -------- 点击按钮发送翻译请求 -------- */
    button.addEventListener('click', () => {
        const selectedText = button.dataset.text;
        if (!selectedText) return;

        /* 加载提示 */
        resultBox.textContent   = 'loading...';
        resultBox.style.top     = `${button.offsetTop + button.offsetHeight + 5}px`;
        resultBox.style.left    = `${button.offsetLeft}px`;
        resultBox.style.display = 'block';

        /* 翻译提示词 */
        const translatePrompt = `Now be a translate bot，please rewrite any content in [[[]]] to ${targetTranslateLanguage}, then abort write anything. content:[[[${selectedText}]]] rewrite result:[[[`;

        /* Ollama 请求体 */
        const requestBody = {
            model: GM_getValue('ollamaModel', OLLAMA_MODEL),
            prompt: translatePrompt,
            stream: false,
            options: {
                num_predict: MAX_TOKENS,
                temperature: 0.5,
                top_p: 0.9,
                top_k: 100,
                repeat_penalty: 1.1
            }
        };

        /* 发送 POST 请求 */
        GM_xmlhttpRequest({
            method: 'POST',
            url: OLLAMA_ENDPOINT,
            headers: { 'Content-Type': 'application/json' },
            data: JSON.stringify(requestBody),
            onload: res => {
                try {
                    if (res.status === 200) {
                        const result = JSON.parse(res.responseText).response; // Ollama 返回字段
                        const startIdx = result.indexOf('[[[');
                        const endIdx = result.indexOf(']]]');
                        const cleaned = endIdx !== -1 ? result.slice(startIdx + 3, endIdx) : result;
                        resultBox.textContent = cleaned.trim();
                    } else {
                        resultBox.textContent = `error code: ${res.status}`;
                    }
                } catch (err) {
                    resultBox.textContent = `error: ${err.message}`;
                    console.error('Parsing error:', err);
                }
            },
            onerror: () => {
                resultBox.textContent = 'Request failed, please check Ollama server.';
            }
        });
    });
})();
