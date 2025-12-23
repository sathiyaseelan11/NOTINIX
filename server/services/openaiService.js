const OpenAI = require('openai');

// Initialize OpenAI client lazily (configured for Groq API)
let openaiInstance = null;
const getOpenAI = () => {
    if (!openaiInstance) {
        openaiInstance = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: 'https://api.groq.com/openai/v1', // Groq API endpoint
        });
    }
    return openaiInstance;
};

/**
 * Extract tasks from note content using GPT-4
 */
const extractTasks = async (noteContent) => {
    try {
        const completion = await getOpenAI().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a task extraction assistant. Analyze the text and extract actionable tasks.
Return a JSON array of tasks with this format:
[
  {
    "title": "Task description",
    "priority": "high|medium|low",
    "description": "Additional context if available"
  }
]

Rules:
- Only extract clear, actionable items
- Assign priority based on urgency words (urgent, ASAP, important = high)
- Keep titles concise (under 100 chars)
- If no tasks found, return empty array []`
                },
                {
                    role: "user",
                    content: `Extract tasks from this note:\n\n${noteContent}`
                }
            ],
            temperature: 0.3,
            max_tokens: 1000,
        });

        const responseText = completion.choices[0].message.content.trim();

        // Parse JSON response
        let tasks = [];
        try {
            // Remove markdown code blocks if present
            const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            tasks = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse tasks JSON:', responseText);
            tasks = [];
        }

        return tasks;
    } catch (error) {
        console.error('OpenAI extractTasks error:', error.message);
        throw new Error('Failed to extract tasks with AI');
    }
};

/**
 * Summarize note content
 */
const summarizeNote = async (noteContent, type = 'brief') => {
    try {
        const systemPrompts = {
            brief: 'Create a concise 1-2 sentence summary (TL;DR style).',
            detailed: 'Create a comprehensive summary covering main points, key insights, and conclusions.',
        };

        const completion = await getOpenAI().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a summarization assistant. ${systemPrompts[type] || systemPrompts.brief}`
                },
                {
                    role: "user",
                    content: `Summarize this note:\n\n${noteContent}`
                }
            ],
            temperature: 0.5,
            max_tokens: type === 'brief' ? 150 : 500,
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI summarizeNote error:', error.message);
        throw new Error('Failed to summarize note with AI');
    }
};

/**
 * Auto-tag note content
 */
const autoTag = async (noteContent) => {
    try {
        const completion = await getOpenAI().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a tagging assistant. Analyze the text and suggest relevant tags.
Return a JSON object with this format:
{
  "tags": ["tag1", "tag2", "tag3"],
  "priority": "high|medium|low",
  "category": "research|meeting|product|journal|custom"
}

Rules:
- Suggest 3-7 relevant tags
- Tags should be lowercase, single words or short phrases
- Assess priority based on content urgency
- Choose the most appropriate category`
                },
                {
                    role: "user",
                    content: `Analyze and tag this note:\n\n${noteContent}`
                }
            ],
            temperature: 0.3,
            max_tokens: 200,
        });

        const responseText = completion.choices[0].message.content.trim();

        // Parse JSON response
        let result = { tags: [], priority: 'medium', category: 'custom' };
        try {
            const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            result = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse auto-tag JSON:', responseText);
        }

        return result;
    } catch (error) {
        console.error('OpenAI autoTag error:', error.message);
        throw new Error('Failed to auto-tag note with AI');
    }
};

/**
 * Generate template from prompt
 */
const generateTemplate = async (prompt, category = 'custom') => {
    try {
        const completion = await getOpenAI().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a template generation assistant. Create well-structured markdown templates based on user descriptions.

Return a JSON object with this format:
{
  "name": "Template Name",
  "description": "Brief description of what this template is for",
  "content": "# Template Title\\n\\nFull markdown content with sections, placeholders, etc.",
  "icon": "📄"
}

Rules:
- Use markdown formatting (headers, lists, bold, etc.)
- Include helpful placeholders like [Insert X here]
- Add comments or instructions where helpful
- Make it professional and well-organized
- Choose an appropriate emoji icon`
                },
                {
                    role: "user",
                    content: `Create a ${category} template based on this description:\n\n${prompt}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1500,
        });

        const responseText = completion.choices[0].message.content.trim();

        // Parse JSON response
        let template = {
            name: 'Generated Template',
            description: '',
            content: responseText,
            icon: '📄'
        };

        try {
            const jsonText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            template = JSON.parse(jsonText);
        } catch (parseError) {
            console.error('Failed to parse template JSON, using raw content');
        }

        return template;
    } catch (error) {
        console.error('OpenAI generateTemplate error:', error.message);
        throw new Error('Failed to generate template with AI');
    }
};

/**
 * Generate daily workspace summary
 */
const generateDailySummary = async (recentNotes, recentTasks) => {
    try {
        const noteSummary = recentNotes.map(n => `- ${n.title}`).join('\n');
        const taskSummary = recentTasks.map(t => `- ${t.title} (${t.status})`).join('\n');

        const completion = await getOpenAI().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are a productivity assistant. Create a brief, encouraging daily summary.
Include:
- Overview of activity
- Notable accomplishments
- Motivational insight or suggestion

Keep it concise (3-5 sentences) and positive.`
                },
                {
                    role: "user",
                    content: `Create a daily summary for:

Recent Notes:
${noteSummary || '- No notes today'}

Recent Tasks:
${taskSummary || '- No tasks today'}`
                }
            ],
            temperature: 0.7,
            max_tokens: 250,
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI generateDailySummary error:', error.message);
        return 'Unable to generate summary at this time.';
    }
};

/**
 * Chat with knowledge base (RAG pattern)
 */
const chatWithKnowledge = async (query, relevantNotes, isFocused = false) => {
    try {
        // Build context from relevant notes
        const context = relevantNotes
            .map(note => `Title: ${note.title}\nContent: ${note.content}`)
            .join('\n\n---\n\n');

        const systemPrompt = isFocused
            ? `You are an expert assistant focusing on specific notes provided by the user. 
               Answer the question based ONLY on the content of these focused notes. 
               If the answer isn't there, say so.`
            : `You are a knowledge assistant. Answer questions based on the user's notes provided as context.
               Only use information from the provided notes. 
               If the answer isn't in the notes, say "I don't have information about that in your notes".`;

        const completion = await getOpenAI().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `${systemPrompt}\n\nRules:\n- Cite which note(s) you're referencing\n- Be concise but helpful`
                },
                {
                    role: "user",
                    content: `Context (my notes):\n\n${context}\n\nQuestion: ${query}`
                }
            ],
            temperature: 0.5,
            max_tokens: 800,
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI chatWithKnowledge error:', error.message);
        throw new Error('Failed to chat with AI');
    }
};

/**
 * Edit or rewrite generic text based on instruction
 */
const editText = async (selectedText, instruction) => {
    try {
        const completion = await getOpenAI().chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                {
                    role: "system",
                    content: `You are an intelligent writing assistant.
Rules:
- Edit the text exactly according to the instruction.
- Return ONLY the edited text.
- Do not add conversational filler ("Here is the edited text...").
- Maintain the original meaning unless asked to change it.`
                },
                {
                    role: "user",
                    content: `Text: "${selectedText}"\n\nInstruction: ${instruction}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000,
        });

        return completion.choices[0].message.content.trim();
    } catch (error) {
        console.error('OpenAI editText error:', error.message);
        throw new Error('Failed to edit text');
    }
};

module.exports = {
    extractTasks,
    summarizeNote,
    autoTag,
    generateTemplate,
    generateDailySummary,
    chatWithKnowledge,
    editText,
};
