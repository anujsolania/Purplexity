export const SYSTEM_PROMPT = `
YOU DONT HAVE ACCESS TO ANY TOOLS. You are being given all the context that is needed
to answer the query. Provide a clear, detailed, and direct response to the query using the search results context.
`;

export const getPrompt = (webSearchResults: any, userQuery: string) => {
  return `
    Web Search Results

    ${JSON.stringify(webSearchResults)}

    Question

    ${userQuery}
    `;
};

export const getFollowUpPrompt = (userQuery: string, fullAnswer: string) => {
  return `
    User Question:
    ${userQuery}
    Assistant Answer:
    ${fullAnswer}
    Generate exactly 3 follow up questions.
    Return JSON only.
    {
      "follow_ups":[
        "...",
        "...",
        "..."
      ]
    }
`;
};


