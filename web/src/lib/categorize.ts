import type { TransactionType } from "./types";

interface CategorizationRule {
  keywords: string[];
  category: string;
  type?: TransactionType;
}

const RULES: CategorizationRule[] = [
  {
    keywords: ["nomina", "salario", "payroll"],
    category: "Transferencias y Efectivo",
    type: "income",
  },
  {
    keywords: ["bizum", "bizoom", "transferencia", "transfer", "traspaso"],
    category: "Transferencias y Efectivo",
  },
  {
    keywords: ["bit2me", "bit 2 me", "cripto"],
    category: "Transferencias y Efectivo",
  },
  {
    keywords: ["efectivo", "cajero"],
    category: "Transferencias y Efectivo",
  },
  {
    keywords: ["hipoteca", "bbva seguro", "seguro hogar", "cuota mensual de fraccionamiento", "fincas", "casa"],
    category: "Vivienda y Préstamos",
  },
  {
    keywords: ["alquiler"],
    category: "Vivienda y Préstamos",
  },
  {
    keywords: ["agua", "luz", "electricidad", "gas", "iberdrola", "endesa", "vodafone", "fibra", "movistar"],
    category: "Suministros",
  },
  {
    keywords: ["gasolina", "repsol", "itv", "parking", "peaje", "carburante"],
    category: "Moto",
  },
  {
    keywords: ["super", "mercadona", "carrefour", "lidl", "aldi", "hipercor", "caprabo", "eroski", "ahorro"],
    category: "Supermercado",
  },
  {
    keywords: ["mascotas", "pienso", "pet"],
    category: "Supermercado",
  },
  {
    keywords: ["donacion", "transporte", "tmb", "metro", "bus", "taxi", "cabify", "uber", "tabaco"],
    category: "Otros Gastos Generales",
  },
  {
    keywords: ["farmacia", "dent", "dentista", "medico", "clinica"],
    category: "Salud y Cuidado",
  },
  {
    keywords: ["gimnas", "gym", "peluqueria", "uñas"],
    category: "Ocio y Entretenimiento",
  },
  {
    keywords: [
      "bar",
      "rest",
      "restaurante",
      "cafeteria",
      "ocio",
      "cine",
      "teatro",
      "concierto",
      "spotify",
      "podimo",
      "apple cloud",
      "icloud",
      "netflix",
      "netfix",
      "prime",
      "amazon prime",
      "viajes",
      "booking",
      "airbnb",
      "compras",
      "druni",
      "zara",
      "shein",
      "h&m",
    ],
    category: "Ocio y Entretenimiento",
  },
  {
    keywords: ["bbva", "comision"],
    category: "BBVA",
  },
  {
    keywords: ["renta 2024", "tributo", "hacienda"],
    category: "Transferencias y Efectivo",
  },
];

const DEFAULT_CATEGORY = "Otros Gastos Generales";

export function categorizeTransaction({
  concept,
  observations,
  amount,
}: {
  concept: string;
  observations?: string | null;
  amount: number;
}): { category: string; type: TransactionType } {
  const haystack = `${concept ?? ""} ${observations ?? ""}`.toLowerCase();

  for (const rule of RULES) {
    if (rule.keywords.some((keyword) => haystack.includes(keyword))) {
      return {
        category: rule.category,
        type: rule.type ?? (amount >= 0 ? "income" : "expense"),
      };
    }
  }

  if (amount > 0) {
    return { category: "Transferencias y Efectivo", type: "income" };
  }

  return { category: DEFAULT_CATEGORY, type: "expense" };
}



