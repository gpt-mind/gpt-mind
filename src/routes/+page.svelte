<script lang="ts">

import { setUserKey, userKey } from '$lib/llm';
import { Mind } from '$lib/Mind';
import { onMount } from 'svelte';
import MicroChat from '$lib/MicroChat';
import { config } from '$lib/config';
import { Automatic111 } from '$lib/Automatic111';

onMount(() => {
    let microChat: any;
    const mind = new Mind({
        "stateMap": {},
        "bindings": {
            "input": ["agent1"],
            "agent1": ['agent2'],
            "agent2": ['agent3'],
            "agent3": ['output', 'think'],
            "canVisualize": ["visualize"],
            "visualize": ["imagery"],
            "think": [],
            "output": [],
        },
        "agents": {
            "agent1": `generate a description of the statement "{{input}}"`,
            "agent2": `generate a response to the statement "{{agent1}}"`,
            "agent3": `generate a response given statements "{{agent1}}"\nand statements "{{agent2}}"`,
            "canVisualize": `is there visualizable imagery in the statement "{{visualize}}"`,
            "visualize": `generate a detailed description of the imagery in the statement "{{agent3}}"`,
            "think": `generate thoughts from the imagery {{imagery}} and the thoughts {{thoughts}} in the statement "{{agent3}}"`,
        },
        start: { "input": "I am a human being", },
        sources: {
            "agent1": (agent: any, query: any, options: any) => agent.complete(query, options).then((res: any) => res.result),
            "agent2": (agent: any, query: any, options: any) => agent.complete(query, options).then((res: any) => res.result),
            "agent3": (agent: any, query: any, options: any) => agent.complete(query, options).then((res: any) => res.result),
            "agent4": (agent: any, query: any, options: any) => agent.complete(query, options).then((res: any) => res.result),
            "canVisualize": (agent: any, query: any, options: any) => agent.complete(query, options).then((res: any) => res.result),
            "visualize": (agent: any, query: any, options: any) => Automatic111.txt2img(query, "", { steps: 20 }),
            "think": (agent: any, query: any, options: any) => agent.complete(query, options).then((res: any) => res.result),
            "output": (agent: any, query: any, options: any) => mind.stateMap.agent3,
        }
    });

    mind.on('after_output', (event: string, mind: any) => 
        microChat.addChatMessage('AI', mind.stateMap.output) 
    );
    ['agent1','agent2','agent3'].forEach((key) => 
        mind.on(`after_${key}`, (event: string, mind: any) => 
            microChat.addToPanel(key, mind.stateMap[key]) 
        )
    );
    ['thoughts','imagery'].forEach((key) => 
        mind.on(`after_${key}`, (event: string, mind: any) => 
            microChat.addToPanel(key, mind.stateMap[key]) 
        )
    );
    microChat = new MicroChat(
        'app', 
        ['Agent', 'Human'],
        async (message: any, user: any, chat: any) => {
            // trim leading and trailing whitespace
            message = message.trim();
            if(!userKey) {
                config.openai.key = message;
                microChat.setNotification('Great! You\'re all set to start chatting with the AI.');
                return;
            }
            if(message.startsWith('sk-')) {
                config.openai.key = message;
                microChat.setNotification('Your API key has been updated.');
                return;
            }
            if(!chat.getNotification().includes(message)) chat.respond(message, user);
            if(user === 'Human') {
                await mind.input('input', message);
            } else {
                microChat.addChatMessage('Agent', message);
            }
        }, {
            showSendButton: true,
            showTypingIndicator: true,
            showChatHistory: true,
            history: [{ message: 'intelligent sentient interface - type anything in the text box below to discuss any topic.'}],
        }
    );
    microChat.setNotification(userKey 
        ? 'Great! You\'re all set to start chatting with the AI.' 
        : 'Enter your OpenAI API key in the chat input at the bottom of this page to get started.'
    );

});

</script>

<style>

</style>

<div id="app"></div>
