import { complete, completionSettings } from "./llm";
import { Mind } from "./Mind";
import PreambleBuilder, { preambles } from "./PreambleBuilder"

function getTranscript() {
    return (window as any).microChat.getTranscript(0) || [];
}

export class Agent {
    constructor(public mind: Mind, public stateMap: any = {}) {
        this.stateMap = stateMap;
        this.stateMap.preamble = preambles.agent;
    }
    getStateKeys() {
        return Object.keys(this.stateMap);
    }
    setStateValue(stateName: string, stateValue: string) {
        this.stateMap[stateName] = stateValue; 
    }
    clearStateValue(state: string) {
        delete this.stateMap[state]
    }
    _buildQuery(query: string, extra: any = {}) {
        const replacements = {
            ...this.stateMap,
            chathistory: getTranscript().join('\n') || '',
            thoughts: this.mind.thoughts.join('\n') || '',
            query,
            ...extra,
        }
        return PreambleBuilder.replace('agent', replacements)
    }
    async respond(question: string, extra: any = {}) { 
        return complete(this._buildQuery(question, extra), completionSettings); 
    }
}