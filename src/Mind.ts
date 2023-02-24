import { Agent } from "./Agent";
import { Conversation } from "./Conversation";
import { complete, completionSettings } from "./llm";
import PreambleBuilder from "./PreambleBuilder";
import { preambles } from "./PreambleBuilder";

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
        const replacements = {
            query,
            jresponses,
        }
        query = PreambleBuilder.replace('verbalize', replacements)
        let r = await complete(query, completionSettings);
        responses.push(`{ "agent": "Integrated", "intensity": "${r}`);
        return [`{ "agent": "Agent", "text": "${r}`];
    }
    async daydream(_transcript: any) {
        const greatQuestions = this.thoughts.length === 0 ? preambles.greatQuestions
            : this.thoughts;
        const gq = greatQuestions[Math.floor(Math.random() * greatQuestions.length)];
        const thoughts = await this.generateResponse(gq || '');
        const transcript = (window as any).microChat.getTranscript(0);
        const replacements = {
            transcript: transcript.join('\n'),
            thoughts: thoughts.join('\n')
        }
        const query = PreambleBuilder.replace('think', replacements);
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