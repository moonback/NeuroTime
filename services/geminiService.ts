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
      
      Tâche : Réécris cette note en une description de mission professionnelle, concise et claire (environ 2-3 phrases) pour un rapport d'activité ou une facture. Corrige les fautes, utilise un ton formel et met en valeur les actions réalisées.
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

export interface ExtractedMission {
  title: string;
  client: string;
  location: string;
  date: string; // Format YYYY-MM-DD
  startTime: string; // Format HH:mm
  endTime?: string; // Format HH:mm (optionnel, sera rempli à la fin de la livraison)
  description?: string;
}

export const extractMissionsFromImage = async (imageFile: File): Promise<ExtractedMission[]> => {
  const ai = getAiClient();
  if (!ai) {
    throw new Error("Clé API Gemini manquante. Veuillez configurer GEMINI_API_KEY dans votre fichier .env");
  }

  try {
    // Convertir l'image en base64
    const base64Image = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        // Retirer le préfixe data:image/...;base64,
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(imageFile);
    });

    const prompt = `
Tu es un assistant expert pour extraire les informations de missions depuis une fiche de demande de date dans l'événementiel.

Analyse cette image de fiche de demande de date et extrais TOUTES les missions présentes.

Pour chaque mission, extrais les informations suivantes :
- title : Titre/nom de la mission (ex: "Régie Son", "Accueil VIP", "Installation lumière")
- client : Nom du client ou de l'organisateur
- location : Lieu de la mission (adresse complète si disponible)
- date : Date de la mission au format YYYY-MM-DD (si l'année n'est pas indiquée, utilise l'année actuelle)
- startTime : Heure de début au format HH:mm (ex: "09:00", "14:30")
- endTime : Heure de fin prévue au format HH:mm (optionnel, seulement si indiquée sur la fiche)
- description : Description ou notes supplémentaires si présentes

IMPORTANT :
- Si plusieurs missions sont présentes sur la fiche, extrais-les toutes
- Si l'heure de fin n'est pas indiquée, laisse endTime vide (elle sera remplie à la fin de la livraison)
- Utilise le format JSON strict suivant pour ta réponse (un tableau de missions) :
[
  {
    "title": "Titre de la mission",
    "client": "Nom du client",
    "location": "Lieu de la mission",
    "date": "YYYY-MM-DD",
    "startTime": "HH:mm",
    "endTime": "HH:mm" ou null,
    "description": "Description optionnelle"
  }
]

Retourne UNIQUEMENT le JSON, sans texte avant ou après. Si aucune mission n'est trouvée, retourne un tableau vide [].
`;

    // Utiliser le format correct pour l'API Gemini avec vision
    // Utiliser gemini-1.5-flash qui supporte la vision d'images
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          text: prompt
        },
        {
          inlineData: {
            mimeType: imageFile.type || 'image/jpeg',
            data: base64Image
          }
        }
      ],
    });

    const responseText = response.text?.trim() || '[]';
    
    // Nettoyer la réponse pour extraire le JSON (enlever les markdown code blocks si présents)
    let jsonText = responseText;
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '').trim();
    }

    const missions = JSON.parse(jsonText) as ExtractedMission[];
    
    // Valider et normaliser les missions
    return missions.map(mission => ({
      ...mission,
      date: mission.date || new Date().toISOString().split('T')[0],
      startTime: mission.startTime || '09:00',
      endTime: mission.endTime || undefined,
    })).filter(mission => mission.title && mission.client && mission.location);
  } catch (error) {
    console.error("Error extracting missions from image:", error);
    throw new Error(`Erreur lors de l'extraction des missions : ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
  }
};