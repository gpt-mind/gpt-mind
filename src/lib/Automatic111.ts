import { config } from "./config";

export class Automatic111 {
    static async txt2img(prompt: string, negativePrompt: string, options: any) {
        const url = config.automatic111.baseUrl;
        const requestBody = {
            prompt,
            negative_prompt: negativePrompt,
            ...options,
        };
        // use fetch to make a POST request to the API
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(requestBody),
            headers: {
                'Content-Type': 'application/json',
            }
        });
        // get the response as a blob
        const data = await response.json();
        // convert the blob to a base64 string
        const base64 = data.data.images[0]

        // return an img tag with the base64 string as the src
        return `<img src="data:image/png;base64,${base64}">`
    }
}