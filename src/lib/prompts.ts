/* eslint-disable @typescript-eslint/no-explicit-any */
import OpenAI from "openai-api";

export function extractReplacementTokens(inputStr: string) {
    const regex = /\{\{([^}]+)\}\}/g;
    const tokens = [];
    let match;
    while ((match = regex.exec(inputStr)) !== null) {
        tokens.push(match[1]);
    }
    return tokens;
}
export function getPromptReplacementFunction(prompt: any, arrayJoin = ",", quote = '"') {
    return (params: { [x: string]: any; }) => {
        let output = prompt;
        const keys = Object.keys(params);
        for (const key of keys) {
            let val = params[key];
            if (Array.isArray(val)) {
                val = `${quote}${val.join(`${quote}${arrayJoin}${quote}`)}${quote}`;
            }
            output = output.replace(`{{${key}}}`, params[key]);
        }
        return output;
    };
}
export function validatePrompt(prompt: any, params: { [x: string]: any; }) {
    const missing = [];
    const tokens = extractReplacementTokens(prompt);
    for (const token of tokens) {
        if (!params[token]) {
            missing.push(token);
        }
    }
    return missing.length ? true : missing;
}
export const defaultSettings = {
    maxTokens: 256,
    temperature: 0.7,
    topP: 1,
    frequencyPenalty: 0.5,
    presencePenalty: 0.5,
    bestOf: 1,
    n: 1,
    stream: false,
    stop: ["\n"],
    engine: "text-davinci-003",
};
function buildExamplePreamble(responseFields: any) {
    const fields = responseFields.reduce((acc: any, field: any) => {
        acc[field] = `<${field}>`;
        return acc;
    }, {} );
    const p = `  Respond using a JSON object with the following fields: ${responseFields.join(', ')}  For example:\n${JSON.stringify(fields)}\nYour response\n{"${responseFields[0]}":`;
    return p.replace(/\\(?!n)/g, '');
}
export function getPromptDefinition(prompt: string) {
    const tokens = extractReplacementTokens(prompt);
    return {
        prompt,
        params: tokens,
        validate: (params: { [x: string]: any; }) => {
            validatePrompt(prompt, params);
        },
        replace: (params: { [x: string]: any; }) => {
            let output = prompt;
            const keys = Object.keys(params);
            for (const key of keys) {
                output = output.replace(`{{${key}}}`, params[key]);
            }
            return output;
        },
        async complete(params: any, apiKey: any, settings: any, responseFields = ['result']) {
            this.validate(params)
            const _settings = Object.assign({}, defaultSettings, settings || {});
            const openapi = new OpenAI(apiKey);
            _settings.prompt = this.replace(params);
            const ex = buildExamplePreamble(responseFields);
            _settings.prompt = `${_settings.prompt}${ex}`;
            let response: any = await openapi.complete(_settings);
            response = response.data.choices[0].text;
            let requestLP: any = ex.split('\n');
            requestLP = requestLP[requestLP.length-1];
            requestLP = requestLP.replace(/\\(?!n)/g, '')
            const parsedResponse = JSON.parse(`${requestLP}${response}`);
            const result: any = responseFields.reduce((acc: any, field: any) => {
                acc[field] = parsedResponse[field];
                return acc;
            }, {} );
            return result;
        }
    };
}
