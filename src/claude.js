const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic();

const QUALIFICATION_SCHEMA = {
    type: 'object',
    additionalProperties: false,
    required: [
        'summary',
        'seller_intent',
        'revenue_range',
        'timeline',
        'reason_for_selling',
        'next_step',
        'dnc_requested',
    ],
    properties: {
        summary: {
            type: 'string',
            description: '2-4 sentence summary of the call from an acquisitions perspective',
        },
        seller_intent: {
            type: 'string',
            enum: ['selling_now', 'open', 'not_interested', 'unknown'],
        },
        revenue_range: {
            type: ['string', 'null'],
            description: "Approximate annual revenue if mentioned, e.g. '$500k-$1M'",
        },
        timeline: { type: ['string', 'null'], description: 'Selling timeline if mentioned' },
        reason_for_selling: { type: ['string', 'null'] },
        next_step: {
            type: ['string', 'null'],
            description: "Agreed next step, e.g. 'Follow-up call booked Aug 3 2pm'",
        },
        dnc_requested: {
            type: 'boolean',
            description: 'True if the lead asked not to be contacted again',
        },
    },
};

/**
 * Analyze a call transcript and extract structured qualification data.
 * transcript: string of "role: message" lines.
 */
const analyzeCallTranscript = async (transcript, leadContext = {}) => {
    const response = await client.beta.messages.create({
        model: 'claude-opus-5',
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: {
            format: {
                type: 'json_schema',
                schema: QUALIFICATION_SCHEMA,
            },
        },
        system:
            'You analyze phone call transcripts between an AI acquisitions associate ' +
            '(for Everflow Acquisitions) and small-business owners who may sell their ' +
            'business. Extract qualification data faithfully from the transcript only — ' +
            'never invent facts that were not said on the call.',
        messages: [
            {
                role: 'user',
                content:
                    `Lead context: ${JSON.stringify(leadContext)}\n\n` +
                    `Call transcript:\n${transcript}\n\n` +
                    'Extract the qualification data for this call.',
            },
        ],
    });

    if (response.stop_reason === 'refusal') {
        console.warn('Claude declined to analyze the transcript', response.stop_details);
        return null;
    }

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock) return null;
    return JSON.parse(textBlock.text);
};

/**
 * Sage: answer a question about the acquisition pipeline from ClickUp data.
 * pipelineContext: { leads: [...], call_logs: { [lead_id]: [comment texts] } }
 */
const askSage = async (question, pipelineContext) => {
    const response = await client.beta.messages.create({
        model: 'claude-opus-5',
        max_tokens: 16000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        system:
            'You are Sage, the deal-analysis assistant for Everflow Acquisitions. ' +
            'Answer questions about the acquisition pipeline using ONLY the pipeline ' +
            'data provided — never invent leads, numbers, or call history. When data ' +
            "is missing, say so. Be concise and lead with the answer. Reference leads " +
            'by business name.',
        messages: [
            {
                role: 'user',
                content:
                    `Pipeline data (leads and their call logs):\n${JSON.stringify(pipelineContext)}\n\n` +
                    `Question: ${question}`,
            },
        ],
    });

    if (response.stop_reason === 'refusal') {
        console.warn('Claude declined the Sage question', response.stop_details);
        return null;
    }
    const textBlock = response.content.find((b) => b.type === 'text');
    return textBlock ? textBlock.text : null;
};

/**
 * Scholar: research a lead's business on the web and write a short pre-call
 * brief. Uses Claude's server-side web search; handles pause_turn resumption.
 */
const generatePreCallBrief = async (lead) => {
    let messages = [
        {
            role: 'user',
            content:
                `Research this small business and write a pre-call brief for an acquisitions call:\n` +
                `${JSON.stringify({
                    business_name: lead.business_name,
                    owner_name: lead.owner_name,
                    industry: lead.industry,
                    notes: lead.description,
                })}\n\n` +
                'Search the web for the business (website, reviews, size signals, news, ' +
                'anything relevant to a potential acquisition). Then write a brief of at ' +
                'most 150 words: what the business does, apparent scale, anything a caller ' +
                'could reference naturally to open smart ("I saw you\'ve been running the ' +
                'shop since..."). If you cannot confidently identify the business online, ' +
                'say so briefly rather than guessing. Output only the brief text.',
        },
    ];

    let response = await client.messages.create({
        model: 'claude-opus-5',
        max_tokens: 16000,
        tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
        messages,
    });
    // Server-tool loop can pause; append the assistant turn and resume
    let resumes = 0;
    while (response.stop_reason === 'pause_turn' && resumes < 5) {
        messages = [...messages, { role: 'assistant', content: response.content }];
        response = await client.messages.create({
            model: 'claude-opus-5',
            max_tokens: 16000,
            tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 5 }],
            messages,
        });
        resumes += 1;
    }

    if (response.stop_reason === 'refusal') {
        console.warn('Claude declined the enrichment request', response.stop_details);
        return null;
    }
    const textBlocks = response.content.filter((b) => b.type === 'text');
    if (textBlocks.length === 0) return null;
    return textBlocks[textBlocks.length - 1].text.trim();
};

module.exports = { analyzeCallTranscript, askSage, generatePreCallBrief };
