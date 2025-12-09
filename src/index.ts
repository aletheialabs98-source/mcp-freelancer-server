import express, { Request, Response } from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

console.log('[STARTUP] Loading environment variables...');
console.log('[STARTUP] PORT:', process.env.PORT || '10000');
console.log('[STARTUP] NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('[STARTUP] CLAUDE_API_KEY:', process.env.CLAUDE_API_KEY ? 'Set (length: ' + process.env.CLAUDE_API_KEY.length + ')' : 'NOT SET ❌');

const app = express();
const PORT = process.env.PORT || 10000;

console.log('[STARTUP] Express app created');

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

console.log('[STARTUP] Middleware configured');

// Initialize Claude
console.log('[STARTUP] Initializing Claude API...');
const anthropic = new Anthropic({
    apiKey: process.env.CLAUDE_API_KEY || '',
});
console.log('[STARTUP] Claude API initialized');

// Configuration
const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-3-5-sonnet-20241022';
const CLAUDE_MAX_TOKENS = parseInt(process.env.CLAUDE_MAX_TOKENS || '2000');

console.log('[STARTUP] Using Claude Model:', CLAUDE_MODEL);

// ============================================================================
// HEALTH CHECK ENDPOINT
// ============================================================================

app.get('/health', (req: Request, res: Response) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime()),
        version: '1.0.0',
    });
});

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'MCP Freelancer Server',
        status: 'running',
        endpoints: {
            health: '/health',
            analyze: '/api/analyze',
        },
    });
});

// ============================================================================
// MCP TOOLS - Helper Functions
// ============================================================================

/**
 * Tool 1: Voice Tone Analyzer
 * Analyzes the writing style and voice tone from user data
 */
async function analyzeVoiceTone(data: any): Promise<string> {
    const prompt = `You are an expert in LinkedIn personal branding and voice analysis.

Analyze the voice tone and writing style based on these details:

**Goals:** ${data.goals || 'Not specified'}
**Pain Points:** ${data.pain_points || 'Not specified'}

Provide a detailed analysis including:

1. **Predicted Voice Tone** (Professional, Casual, Inspirational, Authoritative, etc.)
2. **Key Characteristics** of their current or desired communication style
3. **Emotional Undertones** that should resonate with their audience
4. **Recommendations** for maintaining consistency across all content

Keep the analysis concise but insightful (max 300 words).`;

    try {
        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 500,
            messages: [{ role: 'user', content: prompt }],
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
        console.error('[ERROR] Voice Tone Analyzer:', error.message);
        return `Error analyzing voice tone: ${error.message}`;
    }
}

/**
 * Tool 2: Psychological Triggers Detector
 * Identifies psychological triggers that would resonate with the target audience
 */
async function detectPsychTriggers(data: any): Promise<string> {
    const prompt = `You are an expert in consumer psychology and persuasion.

Based on these details:

**Goals:** ${data.goals || 'Not specified'}
**Pain Points:** ${data.pain_points || 'Not specified'}

Identify 5 psychological triggers that would be most effective:

For each trigger, provide:
1. **Trigger Name** (e.g., Urgency, FOMO, Authority, Social Proof, Reciprocity)
2. **Why it works** for this specific audience
3. **How to apply it** in LinkedIn content

Be specific and actionable (max 400 words).`;

    try {
        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 600,
            messages: [{ role: 'user', content: prompt }],
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
        console.error('[ERROR] Psych Triggers Detector:', error.message);
        return `Error detecting psychological triggers: ${error.message}`;
    }
}

/**
 * Tool 3: Content Ideas Aggregator
 * Generates content ideas based on profile analysis
 */
async function generateContentIdeas(
    data: any,
    voiceAnalysis: string
): Promise<string> {
    const prompt = `You are a LinkedIn content strategist.

Based on:
- **Goals:** ${data.goals || 'Not specified'}
- **Pain Points:** ${data.pain_points || 'Not specified'}
- **Voice Tone Analysis:** ${voiceAnalysis.substring(0, 200)}...

Generate a content strategy with:

1. **Content Pillars** (3-4 main themes to focus on)
2. **10 Specific Post Ideas** aligned with the voice and goals
3. **Posting Frequency Recommendation**
4. **Engagement Strategy** tips

Make it actionable and tailored to their specific situation (max 600 words).`;

    try {
        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 800,
            messages: [{ role: 'user', content: prompt }],
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
        console.error('[ERROR] Content Ideas Generator:', error.message);
        return `Error generating content ideas: ${error.message}`;
    }
}

/**
 * Tool 4: Profile Optimization Recommendations
 * Provides specific recommendations for LinkedIn profile optimization
 */
async function generateProfileOptimization(data: any): Promise<string> {
    const prompt = `You are a LinkedIn profile optimization expert.

Based on:
- **Goals:** ${data.goals || 'Not specified'}
- **Pain Points:** ${data.pain_points || 'Not specified'}
- **LinkedIn URL:** ${data.linkedin_url || 'Not provided'}

Provide specific recommendations for:

1. **Headline Optimization** - 3 headline options that attract the right audience
2. **About Section** - Key elements to include for maximum impact
3. **Featured Section** - What to showcase
4. **Experience Section** - How to frame achievements
5. **Skills & Endorsements** - Top skills to highlight

Be specific and actionable (max 500 words).`;

    try {
        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 700,
            messages: [{ role: 'user', content: prompt }],
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
        console.error('[ERROR] Profile Optimization:', error.message);
        return `Error generating profile recommendations: ${error.message}`;
    }
}

/**
 * Tool 5: Competitor Analysis Insights
 * Analyzes what successful profiles in the same niche are doing
 */
async function analyzeCompetitorInsights(data: any): Promise<string> {
    const prompt = `You are a competitive intelligence analyst for LinkedIn.

Based on the goals: "${data.goals || 'Not specified'}"

Provide insights on:

1. **Common Patterns** successful profiles in this niche use
2. **Content Types** that get the most engagement
3. **Positioning Strategies** that differentiate top performers
4. **Gaps & Opportunities** to stand out from competitors
5. **Action Items** to implement immediately

Be strategic and specific (max 400 words).`;

    try {
        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 600,
            messages: [{ role: 'user', content: prompt }],
        });

        return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error: any) {
        console.error('[ERROR] Competitor Analysis:', error.message);
        return `Error analyzing competitors: ${error.message}`;
    }
}

// ============================================================================
// MAIN ANALYSIS ENDPOINT
// ============================================================================

app.post('/api/analyze', async (req: Request, res: Response) => {
    const startTime = Date.now();

    try {
        const { client_id, service, data } = req.body;

        // Validate required fields
        if (!data) {
            return res.status(400).json({
                success: false,
                error: 'Missing required field: data',
            });
        }

        console.log(`[INFO] Analysis started for client ${client_id || 'unknown'}`);
        console.log(`[INFO] Service: ${service || 'linkedin_optimization'}`);

        // Execute MCP Tools in sequence
        console.log('[INFO] Running Voice Tone Analyzer...');
        const voiceAnalysis = await analyzeVoiceTone(data);

        console.log('[INFO] Running Psychological Triggers Detector...');
        const psychTriggers = await detectPsychTriggers(data);

        console.log('[INFO] Running Content Ideas Generator...');
        const contentIdeas = await generateContentIdeas(data, voiceAnalysis);

        console.log('[INFO] Running Profile Optimization...');
        const profileOptimization = await generateProfileOptimization(data);

        console.log('[INFO] Running Competitor Analysis...');
        const competitorInsights = await analyzeCompetitorInsights(data);

        // Compile final report
        const finalReport = {
            client_info: {
                client_id: client_id || 'N/A',
                name: data.name || 'N/A',
                email: data.email || 'N/A',
                linkedin_url: data.linkedin_url || 'N/A',
            },
            service: service || 'linkedin_optimization',
            analysis: {
                voice_tone: voiceAnalysis,
                psychological_triggers: psychTriggers,
                content_strategy: contentIdeas,
                profile_optimization: profileOptimization,
                competitor_insights: competitorInsights,
            },
            metadata: {
                timestamp: new Date().toISOString(),
                processing_time_ms: Date.now() - startTime,
                model_used: CLAUDE_MODEL,
            },
        };

        console.log(
            `[INFO] Analysis completed in ${Date.now() - startTime}ms for client ${client_id}`
        );

        res.json({
            success: true,
            report: finalReport,
        });
    } catch (error: any) {
        console.error('[ERROR] Analysis failed:', error);

        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error',
            timestamp: new Date().toISOString(),
        });
    }
});

// ============================================================================
// TEST ENDPOINT (for quick testing)
// ============================================================================

app.post('/api/test', async (req: Request, res: Response) => {
    try {
        const testPrompt = req.body.prompt || 'Say hello in Arabic and English!';

        const response = await anthropic.messages.create({
            model: CLAUDE_MODEL,
            max_tokens: 100,
            messages: [{ role: 'user', content: testPrompt }],
        });

        res.json({
            success: true,
            response: response.content[0].type === 'text' ? response.content[0].text : '',
            model: CLAUDE_MODEL,
        });
    } catch (error: any) {
        res.status(500).json({
            success: false,
            error: error.message,
        });
    }
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log(`🚀 MCP Freelancer Server`);
    console.log('='.repeat(60));
    console.log(`✅ Server running on port ${PORT}`);
    console.log(`✅ Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`✅ Claude Model: ${CLAUDE_MODEL}`);
    console.log(`✅ Health check: http://localhost:${PORT}/health`);
    console.log(`✅ Main endpoint: http://localhost:${PORT}/api/analyze`);
    console.log('='.repeat(60));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('[INFO] SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('[INFO] SIGINT received, shutting down gracefully...');
    process.exit(0);
});
