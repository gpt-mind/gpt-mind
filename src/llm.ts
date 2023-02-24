import OpenAI from 'openai-api';

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

export let userKey: string = '';
export function setUserKey(key: string) {
    userKey = key;
}

export async function complete(prompt: any, settings: any) {
    const openAI = new OpenAI(userKey);
    const response = await openAI.complete(completionSettings({ prompt, ...settings }));
    return response.data.choices[0].text;
}