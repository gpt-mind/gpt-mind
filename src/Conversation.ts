import { Agent } from "./Agent";
import { complete, completionSettings } from "./llm";
import PreambleBuilder from "./PreambleBuilder"

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
            const responseList = responses.map((r)=>r.agent+': '+r.text).join('\n')
            const replacements = {
                question,
                responseList,
            }
            const preamble = PreambleBuilder.replace('concensus', replacements);
            let concensus: any = (await complete(preamble, completionSettings));
            concensus = JSON.parse(`{ "concensus": ${concensus}`);
            if(concensus.concensus || !seekConcensus) return responses;
            else return _generateResponses(question);
        }
        return _generateResponses(topic);
    }
}