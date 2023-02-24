import { Agent } from './Agent';
import MicroChat from './MicroChat';
import { Mind, getTextValue } from './Mind';
import { setUserKey, userKey } from './llm';

// create a new mind and assign it to the window
(window as any).mind = new Mind({}, (thought) => (window as any).microChat.addChatMessage(thought.agent || 'Agent', thought.text) );

// emotional agents
let agents = ['Anger', 'Fear', 'Joy', 'Sadness', 'Disgust'].map((emotion) => new Agent({ emotion }));
agents.forEach((agent) => (window as any).mind.addAgent(agent));

// cognitive agents
agents = ['detail-oriented', 'holistic', 'analytical'].map((style) => new Agent({
    style,
    preamble: `Apply your ${style} cognition with an intensity level of {intensity} out of 10 to answer the following question.  Given the following chat history:\n{chathistory}\nAnswer the following question:\n{query}\nand provide a new cognition intensity between 1 and 10 based on the contents of the chat and your response. Answer on A SINGLE LINE ONLY using a JSON object with the following format: { "agent": "${style}", "intensity": 8, "text": "Answer" }\n{ "agent": "${style}", "intensity": `,
}));
agents.forEach((agent) => (window as any).mind.addAgent(agent));

// set the intensity to 3
(window as any).mind.setStateValue('intensity', 3);

// create a new chat component and assign it to the window
(window as any).microChat = new MicroChat(
    'app', 
    ['Agent', 'Human'], 
    async (message: any, user: any, chat: any) => {
        // trim leading and trailing whitespace
        message = message.trim();
        if(!userKey) {
            setUserKey(message);
            (window as any).microChat.setNotification('Great! You\'re all set to start chatting with the AI.');
            return;
        }
        if(!chat.getNotification().includes(message)) chat.respond(message, user);
        if(user === 'Human') {
            await (window as any).mind.setChatHistory(chat.getTranscript(1));
            let a = await (window as any).mind.generateResponse(message);
            if(Array.isArray(a)) a.map((r:any) => JSON.parse(r)).forEach((r:any) => chat.respond(r.text, r.agent || 'Agent'));
            else chat.respond(a.text, a.agent || 'Agent');

            // get the all the agent intensity values
            const intensities = await (window as any).mind.getStateValues('intensity');
            const agentEmotions = await (window as any).mind.getStateValues('emotion');
            const agentStyles = await (window as any).mind.getStateValues('style');
            const styleEmotionIntensities = agentEmotions.map((emotion: any, i: number) => ({
                agent: agentStyles[i] || emotion,
                intensity: intensities[i]
            }));
            // create log output in the internal panel
            (window as any).microChat.clearPanel('internal');
            styleEmotionIntensities.forEach((intensity: any) => {
                chat.addToPanel('internal', `${intensity.agent} intensity: ${intensity.intensity}`)
                chat.emotionBar.updateEmotion(intensity.agent.toLowerCase(), intensity.intensity);
            });
            setTimeout(() => daydream(), 30000);
        }
    }, {
        showSendButton: true,
        showTypingIndicator: true,
        showChatHistory: true,
        history: [{ message: 'intelligent sentient interface - type anything in the text box below to discuss any topic.'}],
        emotions: {
            'anger': 3, 
            'fear': 3, 
            'joy': 3, 
            'sadness': 3, 
            'disgust': 3,
            'detail-oriented': 3, 
            'holistic': 3, 
            'analytical': 3
        }
    }
);
(window as any).microChat.setNotification('Enter your OpenAI API key in the chat input at the bottom of this page to get started.')



let daydreamTimeout: any;
function daydream() {
    const _chatTranscript: any = (window as any).microChat.getTranscript(0);
    (window as any).mind.daydream(_chatTranscript).then((r: any) => {
        (window as any).microChat.clearPanel('history');
        if(Array.isArray(r)) r.filter(r=>r).forEach((q: any) => {
            const op = q.startsWith('{') ? 'setNotification' : 'appendNotification';
            (window as any).microChat[op](getTextValue(q));
        });
        else (window as any).microChat.setNotification(getTextValue(r))
        if(daydreamTimeout) clearTimeout(daydreamTimeout);
        daydreamTimeout = setTimeout(() => daydream(), Math.random() * 60000);
    });
}
//daydream()