import { complete, completionSettings } from "./llm";

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