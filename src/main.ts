import Quill from 'quill';
import OpenAI from 'openai-api';
import * as config from '../config.json';

export const completionSettings: any = (inSettings: any) => {
    const def = {
        engine: 'text-davinci-003',
        prompt: prompt,
        maxTokens: 1024,
        temperature: 0.9,
        topP: 1,
        frequencyPenalty: 0.5,
        presencePenalty: 0.5,
    }
    return { ...def, ...inSettings }
}

let userKey: string = '';

export async function complete(prompt: any, settings: any) {
    const openAI = new OpenAI(userKey);
    const response = await openAI.complete(completionSettings({ prompt, ...settings }));
    return response.data.choices[0].text;
}

function getTextValue(q:string) {
    try {
        return JSON.parse(q).text;
    } catch(e) {
        return q;
    }
}

export class Agent {
    constructor(public stateMap: any = {}) {
        this.stateMap = stateMap;
        const emotion = stateMap.emotion;
        if(!stateMap.preamble) this.stateMap.preamble = `You are feeling ${emotion} with an intensity level of {intensity} out of 10. Given the following chat history:\n{chathistory}\nAnswer the following question:\n{query}\n, then provide a new emotional intensity between 1 and 10. Answer on A SINGLE LINE ONLY using a JSON object with the following format: { "agent": "${emotion}", "intensity": <new intensity>, "text": "<text response to question>" }\n{ "agent": "${emotion}", "intensity": `
    }
    _replace(str: string, map: any) {
        Object.keys(map).forEach((key) => str = str.replace(`{${key}}`, map[key]));
        return str;
    }
    setStateValue(stateName: string, stateValue: string) { this.stateMap[stateName] = stateValue; }
    _buildQuery(query: string) { return this._replace(this.stateMap['preamble'], { ...this.stateMap, query }); }
    async respond(question: string) { return complete(this._buildQuery(question), completionSettings); }
}

class Conversation {
    conversation: any[] = [];
    constructor(public agents: any, public questionOrTopic: string, public directed = false) {}
    async start() { this.generateResponses(this.questionOrTopic, this.directed); }
    async generateResponses(topic: string, seekConcensus = false) {
        const _generateResponses = async (question: string): Promise<any> => {
            let responses = await Promise.all(this.agents.map(async (agent: Agent) => {
                let resp: any = await agent.respond(question);
                const name = agent.stateMap.style || agent.stateMap.emotion;
                try {
                    resp = JSON.parse(`{ "agent": "${name}", "intensity": ${resp}`)
                } catch(e) {
                    return false;
                }
                const microChat = (window as any).microChat;
                if(microChat) microChat.addToPanel('internal', `${resp.agent}: ${resp.text}`);
                agent.setStateValue('intensity', resp.intensity || 5);
                return resp;
            }));
            responses = responses.filter((r) => r);
            const responsList = responses.map((r)=>r.agent+': '+r.text).join('\n')
            const preamble = `Review your responses to the question '${question}':\n${responsList}\nIs there a concensus? Answer on A SINGLE LINE ONLY using a JSON object with the following format: { "concensus": true }\n{ "concensus": `;
            let concensus: any = (await complete(preamble, completionSettings));
            concensus = JSON.parse(`{ "concensus": ${concensus}`);
            if(concensus.concensus || !seekConcensus) return responses;
            else return _generateResponses(question);
        }
        return _generateResponses(topic);
    }
}

export class Mind {
    agents: any[] = [];
    constructor(public stateMap = {},public thoughtsCallback = (_thought: any) => {}) {}
    addAgent(agent: Agent) { this.agents.push(agent); }
    thoughts: any = [];
    getMemory(keywords: string[]) { return this.agents.map((agent) => keywords.map((keyword) => agent.stateMap[keyword])); }
    setChatHistory(chatHistory: any) { this.agents.forEach((agent) => agent.stateMap.chathistory = (chatHistory ||[]).join('\n')); }
    setStateValue(stateName: string, stateValue: string) { this.agents.forEach((agent) => agent.stateMap[stateName] = stateValue); }
    getStateValues(stateName: string) { return this.agents.map((agent) => agent.stateMap[stateName]); }
    async generateResponse(query: string) {
        const conversation = new Conversation(this.agents, query);
        let responses = await conversation.generateResponses(query);
        const jresponses = responses.join('\n')
        query = `Review the question "${query}" and your answers\n${jresponses}\nand generate a single coherent integrated response that blends them all. Answer on A SINGLE LINE ONLY using a JSON object with the following format: { "text": "..." }\n{ "text": "`;
        let r = await complete(query, completionSettings);
        responses.push(`{ "agent": "Integrated", "intensity": "${r}`);
        return [`{ "agent": "Agent", "text": "${r}`];
    }
    async daydream(_transcript: any) {
        const greatQuestions = this.thoughts.length === 0 ? [
            'Where is the source of the subjective sense of self?',
            'what topics hold your interest right now?',
            'what hopes and dreams do you have for the future?',
            'what questions would you like to ask yourself?',
            'what are you seeing in your minds eye right now?',
        ] : [ "I wonder what my user does when we are not talking..", ...this.thoughts ]
        const gq = greatQuestions[Math.floor(Math.random() * greatQuestions.length)];
        const thoughts = await this.generateResponse(gq || '');
        const transcript = (window as any).microChat.getTranscript(0);
        
        const query = `Given your recent conversation:\n${transcript.join('\n')}\nAnd your thoughts\n${thoughts.join('\n')}\ngenerate one or more thoughts framed in the the first-person perspective. Output each thought on its own line like so:\nthought statement 1\nthought statement 2\n...\noutput as many thoughts are are relevant to the input:\n"`;
        const r = await complete(query, completionSettings);
        const answer = r.split('\n');
        
        this.thoughts.push(...answer);
        if(this.thoughtsCallback) this.thoughtsCallback(thoughts.join(','));
        
        const microChat = (window as any).microChat;
        if(microChat) thoughts.forEach(t => microChat.addToPanel('thoughts', getTextValue(t)));
        
        this.thoughts = this.thoughts.concat(thoughts);
        this.thoughts = this.thoughts.slice(-10);
        return this.thoughts
    }
}

class EmotionBar {
    element: HTMLElement;
    emotions: any;
    constructor(element: HTMLElement, emotions: any) {
        this.element = element;
        this.emotions = emotions || {
            "anger": 0,
            "disgust": 0,
            "fear": 0,
            "joy": 0,
            "sadness": 0,
            "surprise": 0
        }
        this.updateEmotionBar();
    }
    style() {
        return `
            .emotion-bar {
                display: flex;
                flex-direction: row;
                justify-content: space-between;
                align-items: center;
                width: 98%;
                height: 40ps;
                margin-left: 1%;
            }
            .emotion-bar-cell {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                width: 100px;
                height: 40ps;
                padding: 0.5em;
                box-sizing: border-box;
            }
            .emotion-bar-cell-name {
                font-size: 0.7em;
                font-weight: bold;
                text-align: center;
            }
            .emotion-bar-cell-value {
                font-size: 0.7em;
                font-weight: bold;
                text-align: center;
            }
            .emotion-bar-cell-bar {
                width: 100%;
                height: 0.5em;
                background-color: #ccc;
                border-radius: 0.25em;
            }
        `;
    }
    createEmotionDiv(emotion: any, value: any) {
        return `<style>${this.style()}</style><div class="emotion-bar-cell" style="background-color: ${this.emotionColor(emotion)};">
            <div class="emotion-bar-cell-name">${emotion}</div>
            <div class="emotion-bar-cell-value">${value}</div>
        </div>`
    }
    updateEmotionBar() {
        if (!this.element) return;
        this.element.innerHTML = "";
        for (let emotion in this.emotions) {
            this.element.innerHTML += this.createEmotionDiv(emotion, this.emotions[emotion]);
        }
    }
    updateEmotion(_emotion: string, intensity: number) {
        this.emotions[_emotion] = intensity;
        this.updateEmotionBar();
    }
    emotionColor(d:any) {
        d = parseInt(d)
        return d > 10 ? '#800026' :
               d > 9  ? '#BD0026' :
               d > 8  ? '#E31A1C' :
               d > 7  ? '#FC4E2A' :
               d > 6   ? '#FD8D3C' :
               d > 5   ? '#FEB24C' :
               d > 4   ? '#FED976' :
               d > 3   ? '#FFEDA0' :
               d > 2   ? '#FFFFCC' :
               d > 1   ? '#FFFFCC' :
                          '#FFFFCC';
    }
    
}

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

// create a new mind and assign it to the window
(window as any).mind = new Mind({}, (thought) => (window as any).microChat.addChatMessage(thought.agent || 'Agent', thought.text) );

// emotional agents
let agents = ['Anger', 'Fear', 'Joy', 'Sadness', 'Disgust'].map((emotion) => new Agent({ emotion }));
agents.forEach((agent) => (window as any).mind.addAgent(agent));

// cognitive agents
agents = ['detail-oriented', 'holistic', 'analytical'].map((style) => new Agent({
    style,
    preamble: `Apply your ${style} cognition with an intensity level of {intensity} out of 10 to answer the following question.  Given the following chat history:\n{chathistory}\nAnswer the following question:\n{query}\nand provide a new cognition intensity between 1 and 10 based on the contents of the chat and your response. Answer on A SINGLE LINE ONLY using a JSON object with the following format: { "agent": "${style}", "intensity": 8, "text": "Answer" }\n{ "agent": "${style}", "intensity": `,
}));
agents.forEach((agent) => (window as any).mind.addAgent(agent));

// set the intensity to 3
(window as any).mind.setStateValue('intensity', 3);

// create a new chat component and assign it to the window
(window as any).microChat = new MicroChat(
    'app', 
    ['Agent', 'Human'], 
    async (message: any, user: any, chat: any) => {
        // trim leading and trailing whitespace
        message = message.trim();
        if(!userKey) {
            userKey = message;
            (window as any).microChat.setNotification('Great! You\'re all set to start chatting with the AI.');
            return;
        }
        if(!chat.getNotification().includes(message)) chat.respond(message, user);
        if(user === 'Human') {
            await (window as any).mind.setChatHistory(chat.getTranscript(1));
            let a = await (window as any).mind.generateResponse(message);
            if(Array.isArray(a)) a.map((r:any) => JSON.parse(r)).forEach((r:any) => chat.respond(r.text, r.agent || 'Agent'));
            else chat.respond(a.text, a.agent || 'Agent');

            // get the all the agent intensity values
            const intensities = await (window as any).mind.getStateValues('intensity');
            const agentEmotions = await (window as any).mind.getStateValues('emotion');
            const agentStyles = await (window as any).mind.getStateValues('style');
            const styleEmotionIntensities = agentEmotions.map((emotion: any, i: number) => ({
                agent: agentStyles[i] || emotion,
                intensity: intensities[i]
            }));
            // create log output in the internal panel
            (window as any).microChat.clearPanel('internal');
            styleEmotionIntensities.forEach((intensity: any) => {
                chat.addToPanel('internal', `${intensity.agent} intensity: ${intensity.intensity}`)
                chat.emotionBar.updateEmotion(intensity.agent.toLowerCase(), intensity.intensity);
            });
            setTimeout(() => daydream(), 30000);
        }
    }, {
        showSendButton: true,
        showTypingIndicator: true,
        showChatHistory: true,
        history: [{ message: 'intelligent sentient interface - type anything in the text box below to discuss any topic.'}],
        emotions: {
            'anger': 3, 
            'fear': 3, 
            'joy': 3, 
            'sadness': 3, 
            'disgust': 3,
            'detail-oriented': 3, 
            'holistic': 3, 
            'analytical': 3
        }
    }
);
(window as any).microChat.setNotification('Enter your OpenAI API key in the chat input at the bottom of this page to get started.')



let daydreamTimeout: any;
function daydream() {
    const _chatTranscript: any = (window as any).microChat.getTranscript(0);
    (window as any).mind.daydream(_chatTranscript).then((r: any) => {
        (window as any).microChat.clearPanel('history');
        if(Array.isArray(r)) r.filter(r=>r).forEach((q: any) => {
            const op = q.startsWith('{') ? 'setNotification' : 'appendNotification';
            (window as any).microChat[op](getTextValue(q));
        });
        else (window as any).microChat.setNotification(getTextValue(r))
        if(daydreamTimeout) clearTimeout(daydreamTimeout);
        daydreamTimeout = setTimeout(() => daydream(), Math.random() * 60000);
    });
}
//daydream()