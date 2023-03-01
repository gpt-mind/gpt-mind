import OpenAI from 'openai-api';
import * as config from './config';

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

// if config.openai.key is set and starts with sk- then use it

export let userKey: string = config.config.openai.key || '';
export function setUserKey(key: string) {
    userKey = key;
}

export async function complete(prompt: any, settings: any) {
    const openAI = new OpenAI(userKey);
    const response = await openAI.complete(completionSettings({ prompt, ...settings }));
    return response.data.choices[0].text;
}