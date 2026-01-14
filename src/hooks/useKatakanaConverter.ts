import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface KatakanaName {
  vietnamese_name: string;
  katakana: string;
}

// Remove diacritics from Vietnamese text
function removeDiacritics(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D");
}

export function useKatakanaConverter() {
  const { data: katakanaNames = [] } = useQuery({
    queryKey: ["katakana-names-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("katakana_names")
        .select("vietnamese_name, katakana");
      if (error) throw error;
      return data as KatakanaName[];
    },
  });

  const convertToKatakana = (fullName: string): string => {
    if (!fullName || katakanaNames.length === 0) return "";

    // Split name into parts
    const nameParts = fullName.trim().toUpperCase().split(/\s+/);
    
    // Convert each part to Katakana
    const katakanaParts = nameParts.map((part) => {
      // First try exact match
      let match = katakanaNames.find(
        (k) => k.vietnamese_name.toUpperCase() === part
      );

      // If no match, try matching without diacritics
      if (!match) {
        const partNoDiacritics = removeDiacritics(part);
        match = katakanaNames.find(
          (k) => removeDiacritics(k.vietnamese_name.toUpperCase()) === partNoDiacritics
        );
      }

      return match ? match.katakana : "";
    });

    // Join with space separator (full-width space for Japanese)
    return katakanaParts.filter(Boolean).join("・");
  };

  return { convertToKatakana, isLoading: katakanaNames.length === 0 };
}
