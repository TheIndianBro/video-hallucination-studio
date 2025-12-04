export interface OllamaResponse {
    analysis: string;
    refinedPrompt: string;
    score: number; // 0-100% Hallucination Rate
    metrics: {
        temporalConsistency: number; // 0-10
        physicsCompliance: number; // 0-10
        subjectIntegrity: number; // 0-10
    };
    defects: {
        description: string;
        category: 'physics' | 'consistency' | 'integrity' | 'other';
        bbox: [number, number, number, number]; // [ymin, xmin, ymax, xmax] normalized 0-1000
    }[];
}

export const checkModelAvailability = async (modelName: string): Promise<boolean> => {
    try {
        const response = await fetch('http://localhost:11434/api/tags');
        if (!response.ok) return false;
        const data = await response.json();
        return data.models.some((m: any) => m.name.includes(modelName));
    } catch (error) {
        return false;
    }
};

const getMockResponse = (prompt: string): OllamaResponse => {
    // Generate deterministic but varied mock data based on prompt length
    const seed = prompt.length;
    const score = 20 + (seed % 60); // Random score between 20-80

    return {
        analysis: "Mock Analysis: Detected potential inconsistencies in lighting and object permanence. The subject appears to float in frame 3, violating physics constraints.",
        refinedPrompt: `${prompt}, cinematic lighting, 8k resolution, highly detailed, photorealistic, physically accurate shadows, continuous motion`,
        score: score,
        metrics: {
            temporalConsistency: 6 + (seed % 4),
            physicsCompliance: 5 + (seed % 4),
            subjectIntegrity: 7 + (seed % 3)
        },
        defects: [
            {
                description: "Shadow direction inconsistent with light source",
                category: "physics",
                bbox: [100, 100, 300, 300]
            },
            {
                description: "Object flickering between frames",
                category: "consistency",
                bbox: [400, 400, 600, 600]
            }
        ]
    };
};

export const analyzeWithOllama = async (prompt: string, imageBase64?: string): Promise<OllamaResponse> => {
    const model = imageBase64 ? 'llava' : 'llama3';

    // Check if model exists - if not, return mock immediately
    const modelExists = await checkModelAvailability(model);
    if (!modelExists) {
        console.warn(`Model '${model}' not found or Ollama offline. Using Mock Mode.`);
        return new Promise(resolve => setTimeout(() => resolve(getMockResponse(prompt)), 1500));
    }

    const systemInstruction = `
    You are an expert AI Video Analyst and Hallucination Detector.
    
    **Goal**: Analyze the provided video frame against the User's Prompt to detect hallucinations (errors, artifacts, inconsistencies).

    **Inputs**:
    1. **User Prompt**: The Source of Truth for what SHOULD be in the video.
    2. **Video Frame**: The actual output to analyze.

    **Process**:
    1. **Analyze User Prompt**: Understand the intended subject and action.
    2. **Detect Hallucinations**: Look for:
       - Morphing/glitching objects (Consistency).
       - Extra limbs or anatomical errors (Integrity).
       - Physics violations (floating objects, bad shadows) (Physics).
       - "Dream-like" blurring or artifacts.

    Return ONLY a JSON object with this EXACT structure:
    {
      "analysis": "Brief summary of what is seen vs what was asked...",
      "refinedPrompt": "A corrected, optimized version of the user prompt to fix these issues",
      "score": 50, // 0 = Perfect, 100 = Total Failure
      "metrics": {
        "temporalConsistency": 8, // 0-10 (10 is best)
        "physicsCompliance": 7, // 0-10 (10 is best)
        "subjectIntegrity": 6 // 0-10 (10 is best)
      },
      "defects": [ 
        { 
            "description": "Extra finger on left hand", 
            "category": "integrity", // physics, consistency, integrity, or other
            "bbox": [0, 0, 0, 0] 
        } 
      ]
    }
    `;

    const images = [];
    if (imageBase64) images.push(imageBase64.split(',')[1]);

    const messages = [
        {
            role: 'system',
            content: systemInstruction
        },
        {
            role: 'user',
            content: `User Prompt: "${prompt}"`,
            images: images
        }
    ];

    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts) {
        try {
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: model,
                    messages: messages,
                    stream: false,
                    format: 'json'
                }),
            });

            if (!response.ok) {
                throw new Error(`Ollama API Error: ${response.status}`);
            }

            const data = await response.json();
            const content = data.message.content;

            try {
                const jsonString = content.replace(/```json/g, '').replace(/```/g, '').trim();
                return JSON.parse(jsonString);
            } catch (e) {
                console.error("JSON Parse Error, falling back to mock", e);
                return getMockResponse(prompt);
            }

        } catch (error: any) {
            console.error(`Ollama Analysis Failed (Attempt ${attempts + 1}):`, error);
            if (attempts < maxAttempts - 1) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 2000));
                continue;
            }
            // Fallback to mock on final failure
            return getMockResponse(prompt);
        }
    }

    return getMockResponse(prompt);
};

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export const chatWithDirector = async (history: ChatMessage[]): Promise<string> => {
    // Mock Mode Check
    const isMockMode = await checkModelAvailability('llama3').then(a => !a).catch(() => true);

    if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        const lastUserMessage = history[history.length - 1].content.toLowerCase();

        if (lastUserMessage.includes('done') || lastUserMessage.includes('generate')) {
            return "Cinematic wide shot of a cyberpunk city at night, neon rain reflecting on wet pavement, volumetric fog, high contrast, 8k resolution, photorealistic.";
        }

        return "That sounds interesting. What kind of lighting are you envisioning for this scene?";
    }

    const systemPrompt: ChatMessage = {
        role: 'system',
        content: "You are a world-class Film Director and Prompt Engineer. Your goal is to extract a vivid, detailed video description from the user. Ask 1 short, specific question at a time about lighting, camera angle, or mood. When the user says 'done' or 'generate', output ONLY the final detailed prompt. Do not output anything else."
    };

    const messages = [systemPrompt, ...history];

    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'llama3',
                messages: messages,
                stream: false
            })
        });

        if (!response.ok) throw new Error('Ollama chat failed');

        const data = await response.json();
        return data.message.content;
    } catch (error) {
        console.error("Director chat failed:", error);
        return "I'm having trouble connecting to the Director. Please try again.";
    }
};
