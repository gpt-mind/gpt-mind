import { Configuration, OpenAIApi } from "openai";
import { pinecone } from "./PineCone";
import { ulid } from "ulid";
import { config } from "./config";

const configuration = new Configuration({ apiKey: config.openai.key });
const openai = new OpenAIApi(configuration);
const MODEL = "text-embedding-ada-002";

export async function createEmbedding(text: string) {
    const embedding = await openai.createEmbedding({
        model: MODEL,
        input: text,
    });

    return embedding.data;
}

export async function upsertEmbedding(input: any, userId = 0) {

    const { text, title } = input;
    const id = ulid();

    const embedding = await createEmbedding(text);
    const vectorEmbedding = embedding.data[0]?.embedding ?? [];
    await pinecone.upsert({
        vectors: [
            {
                id,
                values: vectorEmbedding,
                metadata: { userId, text, title },
            },
        ],
    });

    const record = {
        data: {
            title,
            description: text,
            embeddingId: id,
            userId: userId,
        },
    }

    return {
        test: input.text,
        userId,
        record
    };

}

export async function searchEmbedding(input: any, user = 'user@email.com') {
    const text = input.text;
    const embedding = await createEmbedding(text);
    const vectorEmbedding = embedding.data[0]?.embedding ?? [];
    const pineconeSearch = await pinecone.query({
        topK: 3,
        includeMetadata: true,
        vector: vectorEmbedding,
        filter: { userId: user, },
    });

    return { pineconeSearch, input, user };
}