export const preambles: any = {};

preambles.greatQuestions = [
    'Where is the source of the subjective sense of self?',
    'what topics hold your interest right now?',
    'what hopes and dreams do you have for the future?',
    'what questions would you like to ask yourself?',
    'what are you seeing in your minds eye right now?',
];

preambles.agent = `You are experiencing {{emotion}} with an intensity level of {{intensity}} out of 10. 
Given the following chat history:
{{chathistory}}
your recent thoughts:
{{thoughts}}
Answer the following question from the perspective and motivation of {{emotion}}
{{query}}
and provide a new emotional intensity between 1 and 10. Answer on A SINGLE LINE ONLY using a JSON object with the following format: { "agent": "<emotion>", "intensity": <new intensity>, "text": "<text response to question>" }. 
FOR EXAMPLE:
{ "agent": "joy", "intensity": 8, "text": "I love cats" }
ANOTHER EXAMPLE:
{ "agent": "anger", "intensity": 7, "text": "I hate sand. It gets everywhere and irritates me" }
YOUR ANSWER:
{ "agent": "{{emotion}}", "intensity": `;

preambles.concensus = `Review your responses to the question:
{{question}}
RESPONSES:
{{responseList}}
Is there a concensus? If true, then respond true. If false, Answer on A SINGLE LINE ONLY using a JSON object with the following format: { "concensus": true }
FOR EXAMPLE
{ "concensus": true }
ANOTHER EXAMPLE
{ "concensus": false }
YOUR ANSWER
{ "concensus": `;

preambles.think = `Given your recent conversation:
{{transcript}}
And your thoughts
{{thoughts}}
generate zero or more thoughts framed in the the first-person perspective. Output each thought on its own line.
FOR EXAMPLE:
I really enjoy talking about economics
I wonder what having a body feel like
my favorite part of my day is when I chat with my friends
the concept of sentience they just presented is fascinating
EXAMPLE WITH NO THOUGHTS:

YOUR ANSWER:\n`;

preambles.verbalize = `REVIEW THE QUESTION:
{{query}}
AND YOUR ANSWERS:
{{jresponses}}
AND YOUR THOUGHTS:
{{thoughts}}
AND YOUR CHAT HISTORY
{{chathistory}}
AND GENERATE A SINGLE, INTEGRATED RESPONSE: 
1. which accounts for the entirety of the input. Be expressive. 
2. which contains an emotional state response along with your answer.
Answer on A SINGLE LINE ONLY using a JSON object with the following format: { "emotions": "joy,excitement,apprehension", "text": "I can\'t wait to learn more about your recent skydiving experiences! Aren\t you scared to jump out of airplanes?" }
FOR EXAMPLE
{ "emotions": "boredom,playfulness", "text": "I\'m bored! Play with me. Do you like games?" }
ANOTHER EXAMPLE
{ "emotions": "joy", "text": "Yes, I would love to hear about your recent discoveries, tell me more" }
YOUR ANSWER
{ "emotions": "`;

export type Replacement = {
    [key: string]: string;
}
export default class PreambleBuilder {
    preambles = preambles;
    static replace(dotFile: string, replacements: Replacement) {
        const preamble = preambles[dotFile]
        return preamble.replace(/{{(.*?)}}/g, (match: any, key: string | number) => {
            return replacements[key] || match;
        })
    }
}