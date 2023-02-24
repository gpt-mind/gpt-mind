import { Agent } from "./Agent";
import { Conversation } from "./Conversation";
import { complete, completionSettings } from "./llm";

export function getTextValue(q:string) {
    try {
        return JSON.parse(q).text;
    } catch(e) {
        return q;
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