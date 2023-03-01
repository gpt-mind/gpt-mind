/* eslint-disable @typescript-eslint/no-explicit-any */

import { searchEmbedding, upsertEmbedding } from "./Embeddings";

/*
a long term associative memory for a chatbot implemented using openai embeddings and pinecone

How it works:
1. The user enters a message
2. The message is embedded using openai's api
3. The embedding is stored in a pinecone index
4. The embedding is used to find similar embeddings in the index
5. The messages associated with the similar embeddings are returned to the user

The methods:
upsertEmbedding: takes a message and stores it in the index
searchEmbedding: takes a message and returns similar messages from the index

the mong term memory is implemented as a singleton class
*/

class LongTermMemory {
    static instance: LongTermMemory
    constructor() {
        if (!LongTermMemory.instance) {
            LongTermMemory.instance = this;
        }
        return LongTermMemory.instance;
    }

    async upsertEmbedding(input: any, userId = 0) {
        return await upsertEmbedding(input, userId);
    }

    async searchEmbedding(input: any, user: any = 'user@email.com') {
        return await searchEmbedding(input, user);
    }
}

export default new LongTermMemory();