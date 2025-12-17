import { GoogleGenAI, Type } from "@google/genai";
import { AnimalData } from "../types";

// --- LOCAL MODEL SETUP (COURSE REQUIREMENT) ---
// Access the global MobileNet loaded via script tag in index.html
declare global {
  interface Window {
    mobilenet: any;
  }
}

let model: any = null;

const loadLocalModel = async () => {
  if (model) return model;
  console.log("Loading Local MobileNet Model...");
  // Using the window global from script tag
  if (window.mobilenet) {
    model = await window.mobilenet.load();
    console.log("Local Model Loaded!");
    return model;
  } else {
    throw new Error("MobileNet script not loaded");
  }
};

const classifyImageLocally = async (imgElement: HTMLImageElement) => {
  const net = await loadLocalModel();
  // MobileNet returns array of { className: string, probability: number }
  const predictions = await net.classify(imgElement);
  console.log("Local Recognition Results:", predictions);
  return predictions; // e.g. [{className: "tabby, tabby cat", probability: 0.9}, ...]
};

// --- GEMINI SETUP ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const animalSchema = {
    type: Type.OBJECT,
    properties: {
        species: { type: Type.STRING, description: "The species identified." },
        title: { type: Type.STRING, description: "A creative RPG title." },
        element: { type: Type.STRING, description: "One elemental type: '烈焰', '潮汐', '森罗', '雷霆', '冰霜', '格斗', '大地', '疾风', '灵能', '暗影', '妖精'." },
        flavorText: { type: Type.STRING, description: "Description." },
        stats: {
            type: Type.OBJECT,
            properties: {
                hp: { type: Type.INTEGER },
                attack: { type: Type.INTEGER },
                defense: { type: Type.INTEGER },
                speed: { type: Type.INTEGER }
            },
            required: ["hp", "attack", "defense", "speed"]
        },
        moves: {
            type: Type.ARRAY,
            description: "MUST generate EXACTLY 3 moves.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    type: { type: Type.STRING },
                    power: { type: Type.INTEGER },
                    accuracy: { type: Type.INTEGER },
                    visual_prompt: { type: Type.STRING }
                },
                required: ["name", "description", "type", "power", "accuracy", "visual_prompt"]
            }
        }
    },
    required: ["species", "title", "element", "flavorText", "stats", "moves"]
};

// Helper to ensure 3 moves
const ensureThreeMoves = (data: AnimalData) => {
    const fallbackMoves = [
        { name: "急中生智", description: "不知道该怎么办时使出的招式。", type: "变化", power: 0, accuracy: 100, visual_prompt: "question mark" },
        { name: "咸鱼突刺", description: "普通的攻击。", type: "物理", power: 40, accuracy: 100, visual_prompt: "fish slap" },
        { name: "大声咆哮", description: "试图吓跑对手。", type: "特殊", power: 50, accuracy: 90, visual_prompt: "shout" }
    ];

    if (!data.moves) data.moves = [];
    
    // Fill up to 3 moves
    while (data.moves.length < 3) {
        data.moves.push(fallbackMoves[data.moves.length]);
    }
    
    // Ensure no more than 3
    data.moves = data.moves.slice(0, 3);
    
    return data;
};

export async function generateAnimalCard(base64Image: string, mimeType: string): Promise<AnimalData> {
    try {
        // 1. Create an Image element for Local TensorFlow to consume
        const img = new Image();
        img.src = `data:${mimeType};base64,${base64Image}`;
        await new Promise((resolve) => { img.onload = resolve; });

        // 2. Perform LOCAL Recognition (Course Requirement)
        const predictions = await classifyImageLocally(img);
        
        // Extract top 3 keywords to give context
        const keywords = predictions.map((p: any) => p.className).join(", ");
        console.log("Keywords sent to Gemini:", keywords);

        // 3. Use Gemini Text API to "hallucinate" better stats based on local results
        // We do NOT send the image to Gemini here, satisfying the constraint that recognition is local.
        // We only use Gemini as a creative writer/game designer based on the local model's output.
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `
                My local MobileNet AI identified an image as containing these things: [${keywords}].
                
                Based ONLY on these keywords, create a creative RPG character card for a game called "Beast Battler".
                
                Rules:
                1. Language: SIMPLIFIED CHINESE (简体中文).
                2. Be creative! Interpret the keywords loosely. If it says "keyboard", make a "Cyber Hacker Beast".
                3. Stats sum ~300.
                4. MUST generate EXACTLY 3 unique moves.
                5. Return valid JSON only.
            `,
            config: {
                responseMimeType: "application/json",
                responseSchema: animalSchema,
                temperature: 0.8,
            }
        });

        const jsonText = response.text;
        if (!jsonText) throw new Error("Empty response from Gemini");

        let data = JSON.parse(jsonText) as AnimalData;
        data = ensureThreeMoves(data);

        return data;

    } catch (error) {
        console.error("Generation Error:", error);
        // Fallback
        return {
            species: "未知生物",
            title: "神秘的像素兽",
            element: "一般",
            flavorText: "本地模型甚至无法识别它，这一定是某种高维生物。",
            stats: { hp: 300, attack: 50, defense: 50, speed: 50 },
            moves: [
                { name: "神秘撞击", description: "造成少量伤害", type: "物理", power: 40, accuracy: 100, visual_prompt: "mystery hit" },
                { name: "数据错误", description: "对手感到困惑", type: "变化", power: 0, accuracy: 100, visual_prompt: "glitch" },
                { name: "重试", description: "尝试重新连接", type: "特殊", power: 60, accuracy: 80, visual_prompt: "loading bar" }
            ]
        };
    }
}

export async function generateRandomBoss(): Promise<AnimalData> {
    // Boss generation doesn't need local image recognition, just pure imagination
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "Generate a random, powerful RPG Boss animal. Simplified Chinese. MUST have 3 moves.",
            config: {
                responseMimeType: "application/json",
                responseSchema: animalSchema,
                temperature: 1.0,
            }
        });
        const jsonText = response.text;
        if (!jsonText) throw new Error("Empty response");
        
        let data = JSON.parse(jsonText) as AnimalData;
        data = ensureThreeMoves(data);
        return data;
    } catch (e) {
        console.error(e);
        throw e;
    }
}