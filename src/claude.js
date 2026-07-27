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

module.exports = { analyzeCallTranscript };
