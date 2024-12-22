// ==UserScript==
// @name         Translate Button(KoboldCpp V1 API)
// @namespace    https://github.com/cronrpc/Translate-Local-Tampermonkey
// @version      1.0.1
// @description  A script that adds a translation button to selected text in Tampermonkey.
// @author       cronrpc
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {
    'use strict';

    let target_language_list = ['Chinese', 'English', 'Japanese'];
    let targetTranslateLanguage = GM_getValue('targetTranslateLanguage', 'Chinese');

    target_language_list.forEach(language => {
        GM_registerMenuCommand(`Target: ${language}`, function(event) {
            alert(`Target language set to ${language}`);
            targetTranslateLanguage = language;
            GM_setValue("targetTranslateLanguage", language);
        });
    });

    // 添加样式
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
        #sendButton:hover {
            background-color: #0056b3;
        }
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
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
            z-index: 10001;
        }
    `);

    // 创建按钮元素
    const button = document.createElement('button');
    button.id = 'sendButton';
    button.innerText = 'Translate';
    document.body.appendChild(button);

    // 创建悬浮结果框
    const resultBox = document.createElement('div');
    resultBox.id = 'resultBox';
    document.body.appendChild(resultBox);

    let lastSelectedText = ""
    // 鼠标松开事件，用于弹出按钮
    document.addEventListener('mouseup', (event) => {
        const selection = window.getSelection();
        const selectedText = selection.toString().trim();

        // 如果有选中内容，显示按钮
        if (selectedText && selectedText !== lastSelectedText) {
            if (!button.contains(event.target) && !resultBox.contains(event.target)) {
                const top = event.clientY;
                const left = event.clientX; // 鼠标的 X 坐标
                button.style.top = `${window.scrollY + top - button.offsetHeight - 5}px`;
                button.style.left = `${window.scrollX + left}px`;
                button.style.display = 'block';
                button.dataset.text = selectedText;
            }
        } else {
            // 如果没有选中内容，隐藏按钮和结果框
            if (!button.contains(event.target) && !resultBox.contains(event.target)) {
                button.style.display = 'none';
                resultBox.style.display = 'none';
            }
        }
        lastSelectedText = selectedText;
    });

    // 按钮点击事件
    button.addEventListener('click', () => {
        const selectedText = button.dataset.text;
        if (!selectedText) return;

        // 显示加载中提示
        resultBox.innerText = 'loading...';
        resultBox.style.top = `${button.offsetTop + button.offsetHeight + 5}px`;
        resultBox.style.left = `${button.offsetLeft}px`;
        resultBox.style.display = 'block';

        let translate_prompt = `Now be a translate bot，please rewrite any content in [[[]]] to ${targetTranslateLanguage}, then abort write anything. content:[[[${selectedText}]]] rewrite result:[[[`;

        // 构造请求体
        const requestBody = {
            max_context_length: 2048,
            max_length: 150,
            prompt: translate_prompt,
            quiet: false,
            rep_pen: 1.1,
            rep_pen_range: 256,
            rep_pen_slope: 1,
            temperature: 0.5,
            tfs: 1,
            top_a: 0,
            top_k: 100,
            top_p: 0.9,
            typical: 1
        };

        // 发送 POST 请求
        GM_xmlhttpRequest({
            method: 'POST',
            url: 'http://localhost:5001/api/v1/generate',
            headers: {
                'Content-Type': 'application/json'
            },
            data: JSON.stringify(requestBody),
            onload: (response) => {
                try {
                    if (response.status === 200) {
                        const result = JSON.parse(response.responseText).results[0].text;
                        const first_rightBracket = result.indexOf(']]]')
                        // console.log(first_rightBracket)
                        const cleanedResult = result.slice(0, first_rightBracket);
                        resultBox.innerText = `${cleanedResult}`;
                    } else {
                        resultBox.innerText = `error code: ${response.status}`;
                    }
                } catch (error) {
                    resultBox.innerText = `error: ${error.message}`;
                    console.error("detail error information:", error);
                }
            },
            onerror: () => {
                resultBox.innerText = 'Request failed, please check the server connection.';
            }
        });
    });

    // 点击其他地方隐藏按钮和结果框
    document.addEventListener('click', (e) => {
      /*  if (!button.contains(e.target) && !resultBox.contains(e.target)) {
            button.style.display = 'none';
            resultBox.style.display = 'none';
        }*/
    });
})();
