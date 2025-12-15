import { GoogleGenAI } from "@google/genai";
import { Mission } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

// Fonction utilitaire pour gérer les erreurs et le fallback
const callGeminiSafe = async (model: string, prompt: string) => {
  const ai = getAiClient();
  if (!ai) return null;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });
    return response.text?.trim();
  } catch (error: any) {
    // Si quota dépassé (429), propager l'erreur pour la gérer
    if (error?.status === 429 || error?.toString().includes('429') || error?.toString().includes('RESOURCE_EXHAUSTED')) {
      throw new Error('QUOTA_EXCEEDED');
    }
    console.error(`Error calling Gemini with model ${model}:`, error);
    return null;
  }
};

export const enhanceDescription = async (
  rawText: string,
  context: { title: string; location: string; client: string }
): Promise<string> => {
  try {
    const prompt = `
      Tu es un assistant administratif expert pour un freelance dans l'événementiel (technicien, régisseur, ou hôte).
      
      Contexte de la mission :
      - Titre: ${context.title}
      - Client: ${context.client}
      - Lieu: ${context.location}
      
      Note brute de l'utilisateur : "${rawText}"
      
      Tâche : Réécris cette note en une description de mission professionnelle, concise et claire (environ 2-3 phrases) pour un rapport d'activité. Corrige les fautes, utilise un ton formel et met en valeur les actions réalisées.
      Retourne uniquement le texte amélioré.
    `;

    // Tenter avec le modèle flash (rapide et cheap)
    let result = await callGeminiSafe('gemini-2.0-flash', prompt);
    
    // Si échec (hors quota), tenter avec 1.5 flash
    if (!result) {
        result = await callGeminiSafe('gemini-1.5-flash', prompt);
    }

    return result || rawText;
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') {
      return rawText + " (Amélioration impossible : Quota IA dépassé, réessayez plus tard)";
    }
    return rawText;
  }
};

export const askAssistant = async (
  question: string,
  contextData: { missions: Mission[] }
): Promise<string> => {
  try {
    // Summarize data to save tokens
    const missionSummary = contextData.missions.map(m => ({
      date: m.startTime.split('T')[0],
      client: m.client,
      title: m.title,
      earnings: m.totalEarnings,
      status: m.status,
      paid: m.isPaid
    }));

    const prompt = `
      Tu es l'assistant personnel intelligent de NeuroTime, une application pour freelance événementiel.
      Tu as accès aux données simplifiées des missions de l'utilisateur ci-dessous (format JSON).

      Données :
      ${JSON.stringify(missionSummary)}

      Question de l'utilisateur : "${question}"

      Instructions :
      1. Réponds en français de manière concise et utile.
      2. Si la question nécessite un calcul (revenu total, nombre de missions), fais-le précisément.
      3. Si tu ne peux pas répondre avec les données fournies, dis-le poliment.
      4. Sois proactif : si l'utilisateur demande "revenus", donne le total et peut-être une comparaison rapide.

      Réponse :
    `;

    let result = await callGeminiSafe('gemini-2.0-flash', prompt);
    
    if (!result) {
        result = await callGeminiSafe('gemini-1.5-flash', prompt);
    }

    return result || "Désolé, je n'ai pas pu générer de réponse (Erreur technique).";
  } catch (error: any) {
    if (error.message === 'QUOTA_EXCEEDED') {
      return "Désolé, mon quota d'utilisation gratuit est dépassé pour le moment. Veuillez réessayer dans quelques minutes.";
    }
    return "Une erreur est survenue lors de la communication avec l'assistant.";
  }
};
