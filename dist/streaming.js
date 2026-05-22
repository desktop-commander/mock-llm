"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamResponse = streamResponse;
function splitIntoChunks(content, chunkSize) {
    // Ensure at least one chunk for empty content
    const numChunks = Math.max(1, Math.ceil(content.length / chunkSize));
    return Array.from({ length: numChunks }, (_, i) => content.slice(i * chunkSize, (i + 1) * chunkSize));
}
function createChunks(id, model, created, contentChunks) {
    const chunks = contentChunks.map(content => ({
        id,
        object: 'chat.completion.chunk',
        created,
        model,
        choices: [
            {
                index: 0,
                delta: { content },
                finish_reason: null
            }
        ]
    }));
    // Augment first chunk with role
    chunks[0].choices[0].delta.role = 'assistant';
    // Augment last chunk with finish_reason
    chunks[chunks.length - 1].choices[0].finish_reason = 'stop';
    return chunks;
}
function streamResponse(res, responseJson, status, config) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    // Handle error responses - streaming errors are sent as 200 OK with error in data
    if (status >= 400 || responseJson.error) {
        res.status(200);
        res.write(`data: ${JSON.stringify(responseJson)}\n\n`);
        res.end();
        return;
    }
    res.status(status);
    // Extract content and metadata from response
    const content = responseJson.choices[0].message.content;
    const id = responseJson.id;
    const model = responseJson.model;
    const created = responseJson.created;
    // Create chunks from content
    const contentChunks = splitIntoChunks(content, config.chunkSize);
    const chunks = createChunks(id, model, created, contentChunks);
    let index = 0;
    const interval = setInterval(() => {
        if (index < chunks.length) {
            res.write(`data: ${JSON.stringify(chunks[index])}\n\n`);
            index++;
        }
        else {
            // Send [DONE]
            res.write('data: [DONE]\n\n');
            res.end();
            clearInterval(interval);
        }
    }, config.chunkIntervalMs);
}
//# sourceMappingURL=streaming.js.map