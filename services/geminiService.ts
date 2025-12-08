import { GoogleGenAI, Type } from "@google/genai";
import { Mission } from '../types';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const enhanceDescription = async (
  rawText: string,
  context: { title: string; location: string; client: string }
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return rawText;

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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || rawText;
  } catch (error) {
    console.error("Error enhancing description with Gemini:", error);
    return rawText;
  }
};

export const generateSummary = async (missions: Mission[]): Promise<string> => {
  const ai = getAiClient();
  if (!ai) return "Clé API manquante.";

  try {
    const totalEarnings = missions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
    const missionCount = missions.length;
    const missionData = JSON.stringify(missions.slice(0, 8).map(m => ({
        title: m.title,
        earnings: m.totalEarnings,
        date: m.startTime
    })));

    const prompt = `
      Tu es un coach business pour un freelance événementiel.
      Données récentes :
      - Total missions: ${missionCount}
      - Chiffre d'affaires estimé cumulé: ${totalEarnings}€
      - Liste des dernières missions: ${missionData}
      
      Génère un court paragraphe (max 40 mots) encourageant.
      Si le CA est bon, félicite-le sur l'aspect financier.
      Si peu de missions, encourage la prospection.
      Adopte un ton dynamique et positif. Ne mentionne pas de détails techniques JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || "Impossible de générer le résumé.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Analysez vos données pour voir votre progression.";
  }
};
