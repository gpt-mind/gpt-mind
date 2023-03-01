import { PineconeClient } from "pinecone-client";
import { config } from "./config";

export type Metadata = { userId: string; text: string; title: string };

export const pinecone = new PineconeClient<Metadata>({
    apiKey: config.pinecone.apiKey,
    baseUrl: config.pinecone.baseUrl,
});


// Create a new index
export async function createIndex(requestParameters: any, initOverrides: any): Promise<void> {
    const pinecone = new PineconeClient<Metadata>(requestParameters);
    await pinecone.createIndex(initOverrides);
}

