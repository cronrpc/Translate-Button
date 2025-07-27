# Translate-Button-Tampermonkey

Uses a local API [KoboldCpp](https://github.com/LostRuins/koboldcpp) and Ollama for translation.

English | [中文](#chinese-section)

Translate Button:

![alt text](./assets/images/translate_button.gif)

### It uses a local API for translation.

- This script utilizes [KoboldCpp](https://github.com/LostRuins/koboldcpp), with translation done after opening the local port 5001.

- Tested with the `Mistral-Nemo-Instruct-2407.Q8_0.gguf` model, which provides good support for Chinese, Japanese, and English languages.

- You can change the target language by editing the API parameters and prompt in the `js` file.

You can switch target language by:

![alt text](./assets/images/select_language.gif)

<a id="chinese-section"></a>

### 采用本地API进行翻译

- 这里使用的是[KoboldCpp](https://github.com/LostRuins/koboldcpp)，开启本地5001端口后进行翻译。

- 经测试，`Mistral-Nemo-Instruct-2407.Q8_0.gguf`模型对中日英语言支持良好。

- 通过编辑`js`中的API参数和prompt可以更改目标语言。
