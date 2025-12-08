import { GoogleGenAI, Type } from "@google/genai";
import { Mission } from '../types';
import { Goal } from './goalsService';
import { Client } from './clientService';

const getAiClient = () => {
  if (!process.env.API_KEY) {
    console.warn("API_KEY is missing from environment variables.");
    return null;
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatContext {
  missions: Mission[];
  clients: Client[];
  goals: Goal[];
}

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

// Générer le contexte complet pour la conversation
const buildContextPrompt = (context: ChatContext): string => {
  const { missions, clients, goals } = context;
  
  // Statistiques générales
  const totalMissions = missions.length;
  const completedMissions = missions.filter(m => m.status === 'completed').length;
  const plannedMissions = missions.filter(m => m.status === 'planned').length;
  const totalEarnings = missions.reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
  const paidEarnings = missions.filter(m => m.isPaid).reduce((acc, m) => acc + (m.totalEarnings || 0), 0);
  const unpaidEarnings = totalEarnings - paidEarnings;
  
  // Missions récentes (5 dernières)
  const recentMissions = missions
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 5)
    .map(m => ({
      titre: m.title,
      client: m.client,
      lieu: m.location,
      date: new Date(m.startTime).toLocaleDateString('fr-FR'),
      statut: m.status,
      gains: m.totalEarnings,
      payé: m.isPaid ? 'Oui' : 'Non'
    }));
  
  // Clients
  const clientsList = clients.map(c => c.name).join(', ');
  
  // Objectifs
  const goalsList = goals.map(g => {
    const periodLabel = g.period === 'month' ? 'mensuel' : 'annuel';
    const typeLabel = g.type === 'revenue' ? 'CA' : g.type === 'missions' ? 'missions' : 'heures';
    return `${typeLabel} ${periodLabel}: ${g.target}`;
  }).join(', ');
  
  return `Tu es un assistant IA expert pour un freelance dans l'événementiel (technicien, régisseur, hôte d'accueil).

CONTEXTE COMPLET DE L'UTILISATEUR :

📊 STATISTIQUES GÉNÉRALES :
- Total missions : ${totalMissions}
- Missions complétées : ${completedMissions}
- Missions planifiées : ${plannedMissions}
- Chiffre d'affaires total : ${totalEarnings.toFixed(2)}€
- CA payé : ${paidEarnings.toFixed(2)}€
- CA en attente : ${unpaidEarnings.toFixed(2)}€

📋 MISSIONS RÉCENTES (5 dernières) :
${JSON.stringify(recentMissions, null, 2)}

👥 CLIENTS :
${clientsList || 'Aucun client enregistré'}

🎯 OBJECTIFS :
${goalsList || 'Aucun objectif défini'}

Tu peux répondre à des questions sur :
- Les missions (statut, dates, gains, clients)
- Les statistiques financières
- Les objectifs et la progression
- Des conseils pour améliorer l'activité
- L'analyse des performances
- La planification et l'organisation

Réponds de manière professionnelle, concise et utile. Utilise les données fournies pour donner des réponses précises.`;
};

// Conversation live avec Gemini
export const chatWithGemini = async (
  message: string,
  history: ChatMessage[],
  context: ChatContext
): Promise<string> => {
  const ai = getAiClient();
  if (!ai) {
    return "Clé API Gemini manquante. Veuillez configurer GEMINI_API_KEY dans votre environnement.";
  }

  try {
    // Construire le prompt avec le contexte
    const contextPrompt = buildContextPrompt(context);
    
    // Construire l'historique de conversation sous forme de texte
    let historyText = '';
    if (history.length > 0) {
      historyText = '\n\nHISTORIQUE DE LA CONVERSATION :\n';
      history.forEach((msg, index) => {
        const roleLabel = msg.role === 'user' ? 'UTILISATEUR' : 'ASSISTANT';
        historyText += `${roleLabel}: ${msg.content}\n`;
      });
    }
    
    // Construire le prompt complet
    const fullPrompt = `${contextPrompt}${historyText}\n\nNOUVELLE QUESTION DE L'UTILISATEUR: ${message}\n\nRéponds à cette question en tenant compte du contexte et de l'historique de conversation.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: fullPrompt,
    });

    return response.text?.trim() || "Désolé, je n'ai pas pu générer de réponse.";
  } catch (error) {
    console.error("Erreur lors de la conversation avec Gemini:", error);
    return "Une erreur est survenue lors de la communication avec l'IA. Veuillez réessayer.";
  }
};
