import { Agent } from "./Agent";
import { complete, completionSettings } from "./llm";

export class Conversation {
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