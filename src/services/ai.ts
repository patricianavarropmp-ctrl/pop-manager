import { GoogleGenerativeAI } from "@google/generative-ai";
import { settingsService } from "./settings";
import { EditorStep } from "../types";

export interface AIResult {
    steps: EditorStep[];
    usage: {
        promptTokens: number;
        responseTokens: number;
        totalTokens: number;
    };
}

export const aiService = {
    async processVideo(videoFile: File, onProgress?: (msg: string) => void): Promise<AIResult> {
        onProgress?.("Buscando chave de acesso...");
        const apiKey = await settingsService.getGeminiApiKey();
        if (!apiKey) {
            throw new Error("Gemini API Key não encontrada nas configurações.");
        }

        // Diagnóstico de tamanho (InlineData tem limite de ~20MB no browser/File API)
        const fileSizeMB = videoFile.size / (1024 * 1024);
        console.log(`[AI Diagnostic] File size: ${fileSizeMB.toFixed(2)} MB`);

        if (fileSizeMB > 20) {
            throw new Error(`Vídeo muito grande (${fileSizeMB.toFixed(1)}MB). O limite para processamento direto é 20MB. Tente um vídeo mais curto ou com menor resolução.`);
        }

        onProgress?.("Conectando ao servidor Google...");
        const genAI = new GoogleGenerativeAI(apiKey);

        onProgress?.("Configurando modelo Gemini 2.5 Flash...");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        onProgress?.("Alocando memória (base64 conversion)...");
        const fileData = await this.fileToGenerativePart(videoFile);

        onProgress?.("Enviando dados para o Google (processamento)...");
        console.time("ai-processing");

        const prompt = `
            Você é um especialista em Processos Operacionais Padrão (POP).
            Analise o vídeo anexado e crie um guia passo-a-passo detalhado do que está acontecendo.
            
            REGRAS CRÍTICAS:
            1. CENSURA: Se o vídeo mostrar dados sensíveis (CPFs, senhas, chaves de API, endereços privados), NÃO os inclua na descrição. Use termos genéricos como "[DADO PROTEGIDO]" ou "[VALOR PRIVADO]".
            2. FORMATO: Retorne estritamente um JSON que seja uma lista de objetos seguindo esta estrutura:
                [
                  { 
                    "title": "Título do Passo", 
                    "description": "Descrição detalhada",
                    "timestamp": "Tempo no vídeo (ex: 00:15)"
                  }
                ]

            O objetivo é que uma pessoa que nunca viu este processo consiga executá-lo com perfeição apenas lendo o que você gerar. Seja técnico e preciso.
            Retorne APENAS o JSON bruto, sem explicações extras ou markdown adicional fora do código.
        `;

        const withTimeout = (promise: Promise<any>, timeoutMs: number) => {
            return Promise.race([
                promise,
                new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT_AI")), timeoutMs))
            ]);
        };

        try {
            const result = await withTimeout(
                model.generateContent([prompt, fileData]),
                300000 // 5 minutos de timeout
            );

            console.timeEnd("ai-processing");
            onProgress?.("Interpretando resposta da IA...");
            const responseData = result.response;
            let text = responseData.text();

            // Limpar possíveis blocos de código markdown que a IA pode retornar sem o JSON Mode ativado
            if (text.includes("```json")) {
                text = text.split("```json")[1].split("```")[0].trim();
            } else if (text.includes("```")) {
                text = text.split("```")[1].split("```")[0].trim();
            }

            const usage = responseData.usageMetadata;
            const steps = JSON.parse(text);
            const formattedSteps = steps.map((s: any, i: number) => ({
                id: Date.now() + i,
                title: s.title || "Passo sem título",
                description: s.description || "",
                image: null,
                video_timestamp: s.timestamp || null
            }));

            return {
                steps: formattedSteps,
                usage: {
                    promptTokens: usage?.promptTokenCount || 0,
                    responseTokens: usage?.candidatesTokenCount || 0,
                    totalTokens: usage?.totalTokenCount || 0
                }
            };
        } catch (err: any) {
            console.timeEnd("ai-processing");
            if (err.message === "TIMEOUT_AI") {
                throw new Error("A IA demorou mais de 5 minutos para responder. O vídeo pode ser complexo demais ou a conexão falhou.");
            }
            if (err.message?.includes("429")) {
                throw new Error("Limite de requisições excedido (Quota). Aguarde um minuto e tente novamente.");
            }
            console.error("Erro no processamento de IA:", err);
            throw new Error(`Erro na IA: ${err.message || "Erro desconhecido"}`);
        }
    },

    async fileToGenerativePart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
        const base64EncodedDataPromise = new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = (reader.result as string).split(',')[1];
                resolve(base64);
            };
            reader.readAsDataURL(file);
        });

        return {
            inlineData: {
                data: await base64EncodedDataPromise,
                mimeType: file.type,
            },
        };
    }
};
