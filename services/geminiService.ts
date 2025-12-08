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

export const analyzeImageAndExtractMissions = async (imageBase64: string, mimeType: string): Promise<Partial<Mission>[]> => {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("Clé API Gemini manquante. Veuillez configurer GEMINI_API_KEY dans votre fichier .env.local");
  }

  try {
    const prompt = `
      Tu es un assistant expert pour analyser des documents de missions événementielles (planning, feuilles de route, emails, etc.).
      
      Analyse cette image et extrais TOUTES les missions/événements que tu peux identifier.
      
      Pour chaque mission, extrais les informations suivantes si disponibles :
      - title : Titre/nom de la mission (ex: "Concert", "Mariage", "Festival", "Événement corporate")
      - client : Nom du client ou organisateur
      - location : Lieu de la mission (adresse complète si possible)
      - description : Description détaillée de la mission (ce qui doit être fait)
      - startTime : Date et heure de début au format ISO 8601 (ex: "2024-12-25T14:00:00.000Z")
      - endTime : Date et heure de fin au format ISO 8601
      - rateType : Type de tarification ("day", "night", "mixed", ou "custom")
      - hourlyRate : Taux horaire en euros (nombre, pas de symbole €)
      - totalEarnings : Montant total estimé en euros (nombre, pas de symbole €)
      
      Si tu ne trouves pas certaines informations, utilise des valeurs par défaut raisonnables :
      - rateType : "day" par défaut
      - hourlyRate : 0 si non spécifié
      - totalEarnings : 0 si non spécifié
      - status : "planned" par défaut
      
      IMPORTANT : Retourne UNIQUEMENT un tableau JSON valide, sans texte avant ou après.
      Format attendu :
      [
        {
          "title": "Nom de la mission",
          "client": "Nom du client",
          "location": "Adresse",
          "description": "Description",
          "startTime": "2024-12-25T14:00:00.000Z",
          "endTime": "2024-12-25T18:00:00.000Z",
          "rateType": "day",
          "hourlyRate": 50,
          "totalEarnings": 200,
          "status": "planned"
        }
      ]
      
      Si aucune mission n'est trouvée, retourne un tableau vide [].
      Assure-toi que le JSON est valide et parsable.
    `;

    // Convertir l'image base64 en format pour Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          parts: [
            { text: prompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType,
              },
            },
          ],
        },
      ],
    });

    const responseText = response.text?.trim() || '';
    
    // Nettoyer la réponse pour extraire le JSON (enlever markdown si présent)
    let jsonText = responseText;
    if (jsonText.includes('```json')) {
      jsonText = jsonText.split('```json')[1].split('```')[0].trim();
    } else if (jsonText.includes('```')) {
      jsonText = jsonText.split('```')[1].split('```')[0].trim();
    }

    // Parser le JSON
    const missions = JSON.parse(jsonText);
    
    if (!Array.isArray(missions)) {
      console.warn("La réponse de Gemini n'est pas un tableau:", missions);
      return [];
    }

    // Valider et formater les missions
    return missions.map((mission: any) => ({
      title: mission.title || 'Mission sans titre',
      client: mission.client || 'Client non spécifié',
      location: mission.location || 'Lieu non spécifié',
      description: mission.description || '',
      startTime: mission.startTime || new Date().toISOString(),
      endTime: mission.endTime || new Date().toISOString(),
      rateType: mission.rateType || 'day',
      hourlyRate: Number(mission.hourlyRate) || 0,
      totalEarnings: Number(mission.totalEarnings) || 0,
      status: mission.status || 'planned',
    }));
  } catch (error) {
    console.error("Error analyzing image with Gemini:", error);
    throw new Error(`Erreur lors de l'analyse de l'image : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};