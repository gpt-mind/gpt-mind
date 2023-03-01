import { json } from '@sveltejs/kit';

const SERVER_URL = 'http://127.0.0.1:7860/sdapi/v1/txt2img';
const DEFAULT_PROMPT = 'A dog made of hot dogs';

/** @type {import('./$types').RequestHandler} */
export async function GET(request: any) {
    console.log(request)
    let { searchParams } = request.url;
    const prompt =  searchParams.prompt ? searchParams.prompt : DEFAULT_PROMPT;
    searchParams = searchParams ? searchParams : DEFAULT_PROMPT
    console.log(prompt)
    const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', },
        body: JSON.stringify({  
            prompt,
            negative_prompt: '',
            steps: 20,
            width: 256,
            height: 256,
        }),
    });
    const data = await response.json();
    const image = data.images[0];
    return json({
        status: 200,
        body: image,
    });
}

