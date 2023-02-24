import { EmotionBar } from "./EmotionBar";
import Quill from 'quill';

export default class MicroChat {
    defaultOptions = {
        showSendButton: true,
        showTypingIndicator: true,
        showChatHistory: true
    }
    users: string[] = [];
    userIdx = 0;
    callback: any;
    options: any = {};
    editor: any;
    history: any = [];
    element: HTMLElement | null = null;
    emotionBar: EmotionBar | null = null;
    constructor(elementIdOrObject: any, users: string[], callback: any, options: any) {
        if (elementIdOrObject instanceof HTMLElement) {
            this.element = elementIdOrObject;
        } else { this.element = document.getElementById(elementIdOrObject); }
        if(this.element) {
            this.element.innerHTML = `
                <div id="chat-container">
                <style>${this.css()}</style>
                <div id="notification" class="chat-notification"></div>
                <div class="chat-internals">
                    <pre class="internals-panel" id="thoughts"></pre>
                    <pre class="internals-panel" id="internal"></pre>
                    <pre class="internals-panel" id="history"></pre>
                    <pre class="internals-panel" id="transcript"></pre>
                </div>
                <div id="emotions" class="emotion-bar"></div>
                <div class="chat-history"></div>
                <div class="text-input"><div id="editor"></div></div>
                <div id="toolbar" style="display:none"></div></div>`;
        }
        this.users = users || [];
        this.callback = callback || (() => { });
        this.options = Object.assign({}, this.defaultOptions, options);
        this.createQuill();
        if(options.history) {
            options.history.forEach((item: any) => {
                if(item.user) this.addChatMessage(item.user, item.message, false);
                else this.addInfoMessage(item.message, false);
            });
        }
        if(options.emotions) {
            if(!this.element) return;
            const eb = this.element.querySelector(".emotion-bar");
            if(!eb) return;
            this.emotionBar = new EmotionBar(eb as HTMLElement, options.emotions);
        }
    }
    addToPanel(panel: string, message: string) {
        const el = document.getElementById(panel);
        if(!el) return;
        el.innerHTML += '\n' + message;
    }
    clearPanel(panel: string) {
        const el = document.getElementById(panel);
        if(!el) return;
        el.innerHTML = '';
    }
    setNotification(notification: string) {
        const el = document.getElementById('notification')
        if(!el) return;
        el.innerHTML = notification;
        el.style.display = 'block'
    }
    appendNotification(notification: string) {
        const el = document.getElementById('notification')
        if(!el) return;
        el.innerHTML += el.innerHTML ? '<br/>' + notification : notification;
        el.style.display = 'block'
    }
    getNotification() {
        const el = document.getElementById('notification')
        if(!el) return '';
        return el.innerHTML;
    }
    getTranscript(extra: number) {
        const transcript = [];
        for(var i=0;i< this.history.length - 1 - extra; i++) {
            const h = this.history[i];
            const agent = h.user + "; " || '';
            transcript.push(`${agent}${h.message}`);
        }
        return transcript;
    }
    createChatMessage(user: any, message: any, time: any) {
        if(!user || !message || !time) return '';
        return `<div class="chat-message">
            <div class="chat-message-user">${user}</div>
            <div class="chat-message-time">${time}</div>
            <div class="chat-message-text">${message}</div>
        </div>`;
    }
    createInfoMessage(message: any) {
        if(!message) return '';
        return `<div class="chat-message">
            <div class="chat-message-text">${message}</div>
        </div>`;
    }
    addInfoMessage(message: any, addToHistory: boolean = true) {
        if (!this.element) return;
        const chatHistory = this.element.querySelector(".chat-history");
        if (!chatHistory) return;
        const html = this.createInfoMessage(message);
        chatHistory.insertAdjacentHTML('beforeend', html);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        if(addToHistory) this.history = this.history.concat({ message });
    }
    addChatMessage(user: any, message: any, addToHistory: boolean = true) {
        if (!this.element) return;
        const chatHistory = this.element.querySelector(".chat-history");
        if (!chatHistory) return;
        const now = new Date();
        const time = `${now.getHours()}:${now.getMinutes()}`;
        const html = this.createChatMessage(user, message, time);
        chatHistory.insertAdjacentHTML('beforeend', html);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        if(addToHistory) this.history = this.history.concat({ user, message });
        this.addToPanel('transcript', `${user}: ${message}`);
    }
    createQuillToolbar() {
        if (!this.element) return;
        const toolbar = this.element.querySelector(".ql-toolbar");
        if (!toolbar) return;
        toolbar.innerHTML = `
            <span class="ql-formats">
                <button class="ql-link"></button>
                <button class="ql-image"></button>
                <button class="ql-video"></button>
            </span>
            <span class="ql-formats">
                <button class="ql-clean"></button>
            </span>`
    }
    typing(isTyping: boolean) {
        if (!this.element) return;
        const notification = this.element.querySelector(".chat-notification");
        if (!notification) return;
        if (isTyping) { notification.classList.add("typing"); }
        else { notification.classList.remove("typing"); }
    }
	css() {
		return `
		.chat-container {
			display: flex;
			flex-direction: column;
			height: 100%;
			width: 80%;
			background-color: #fff;
			border: 1px solid #333;
            margin: 10px;
			border-radius: 5px;
			overflow: hidden;
		}
        .chat-internals {
            display: flex;
            flex-direction: row;
            height: 80%;
            width: 99%;
            background-color: #fff;
            border: 1px solid #333;
            margin: 5px;
            border-radius: 5px;
            margin: 5px;
        }
        .internals-panel {
            flex: 1;
            padding: 10px;
            overflow-y: scroll;
            background-color: #eee;
            border: 1px solid #333;
            margin: 5px;
            border-radius: 5px;
            min-height: 80px;
            max-height: 80px;
            font-size: 8px;
            margin: 5px;
            overflow: scroll-y;
        }
		.chat-history {
			flex: 1;
			padding: 10px;
			overflow-y: scroll;
			background-color: #fff;
            max-height: 80%;
		}
		.chat-message {
            background-color: #fff;
			border: 1px solid #333;
			border-radius: 5px;
			margin-bottom: 10px;
            padding:10px;
		}
		.chat-message:last-child {
			margin-bottom: 0;
		}
		.chat-message:nth-child(odd) {
			background-color: #f1f1f1;
		}
		.chat-message:hover {
			background-color: #f1f1f1;
			border-color: #999;
		}
		.chat-message-user {
			font-weight: bold;
		}
		.chat-message-time {
			font-size: 0.8em;
			color: #999;
		}
		.chat-message-text {
			font-size: 0.9em;
		}
		.chat-notification {
			padding: 10px;
			background-color: #fff;
			border-top: 1px solid #ccc;
		}
		.chat-typing {
			display: block;
		}
		.text-input {
			padding: 10px;
			background-color: #fff;
			border-top: 1px solid #ccc;
		}
		.text-input .ql-toolbar {
			border: none;
		}
		.text-input .ql-container {
			border: none;
		}
        .ql-editor {
            min-height: 100px;
            max-height: 100px;
            border: 1px solid #333;
            border-radius: 5px;
        }`
	}
    createQuill() {
        if (!this.element) return;
        const editor = this.element.querySelector("#editor");
        if (!editor) return;
        this.options.quill = {
            modules: {
                toolbar: {
                    container: '#toolbar',
                    handlers: {
                        'image': () => {
                            const range = this.editor.getSelection();
                            const value = prompt('What is the image URL');
                            if (value) {
                                this.editor.insertEmbed(range.index, 'image', value, Quill.sources.USER);
                            }
                        }
                    }
                },
                keyboard: {
                    bindings: {
                        shift_enter: {
                            key: 13,
                            shiftKey: true,
                            handler: (range: any, _ctx: any) => this.editor.insertText(range.index, "\n")
                        },
                        enter: { key: 13, handler: () => this.sendMessage(this.editor.getText(), this.users[1]) }
                    }
                }
            },
            placeholder: 'Enter your message...',
            theme: 'snow'
        }
        this.editor = new Quill(editor, this.options.quill);
    }
    sendMessage(message: string, user: string | undefined) {
        if (!user) user = this.users[1];
        if (!message) return;
        this.editor.setText('');
        this.typing(true);
        this.callback(message, user, this);
    }
    respond(message: any, user: any) {
        if (!user) user = this.users[0];
        if (message instanceof Array) {
            message.forEach((msg: any) => this.respond(msg, user));
            return;
        } 
        this.addChatMessage(user, message);
    }
}