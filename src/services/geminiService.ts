import { getSupabase } from './authService';

export const enhanceDescription = async (
  rawText: string,
  context: { title: string; location: string; client: string }
): Promise<string> => {
  const supabase = getSupabase();
  if (!supabase) {
    console.warn("Supabase client non initialisé pour l'appel AI");
    return rawText;
  }

  try {
    const { data, error } = await supabase.functions.invoke('enhance-description', {
      body: { rawText, context }
    });

    if (error) {
      console.error("Erreur lors de l'appel à l'Edge Function Gemini:", error);
      return rawText;
    }

    return data?.text || rawText;
  } catch (error) {
    console.error("Erreur inattendue lors de l'appel à l'Edge Function Gemini:", error);
    return rawText;
  }
};
