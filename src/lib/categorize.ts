import { TransactionType } from "./types";

const CATEGORY_KEYWORDS: Record<
  string,
  { includes: string[]; type: TransactionType }
> = {
  ingresos: {
    includes: ["nomina", "recibido", "transferencia", "devolucion", "bizum"],
    type: "income",
  },
  alimentacion: {
    includes: [
      "super",
      "mercadona",
      "carrefour",
      "aldi",
      "lid",
      "lidl",
      "caprabo",
      "hipercor",
      "ahorro",
      "rest",
      "cafe",
      "bar",
      "pan",
      "food",
    ],
    type: "expense",
  },
  hogar: {
    includes: [
      "energia",
      "gas",
      "agua",
      "iberdrola",
      "alquiler",
      "hipoteca",
      "amazon.es",
      "leroy",
      "ikea",
    ],
    type: "expense",
  },
  transporte: {
    includes: [
      "cabify",
      "uber",
      "bolt",
      "petrol",
      "gasolinera",
      "repsol",
      "cepsa",
      "renfe",
      "metro",
      "bus",
      "taxi",
      "motosharing",
    ],
    type: "expense",
  },
  ocio: {
    includes: [
      "netflix",
      "spotify",
      "cine",
      "teatro",
      "concierto",
      "fest",
      "zara",
      "shein",
      "h&m",
      "primark",
      "ocio",
      "entradas",
      "booking",
      "airbnb",
    ],
    type: "expense",
  },
  salud: {
    includes: [
      "farmacia",
      "dent",
      "medico",
      "clinica",
      "seguro",
      "gimnas",
      "gym",
      "fisi",
      "fisio",
    ],
    type: "expense",
  },
  educacion: {
    includes: ["curso", "formacion", "suscripcion", "udemy", "platzi"],
    type: "expense",
  },
  tecnologia: {
    includes: ["apple", "iphone", "spotify", "google", "microsoft", "software", "ics"],
    type: "expense",
  },
  viajes: {
    includes: ["hotel", "airbnb", "ryanair", "vueling", "viaje"],
    type: "expense",
  },
  transferencias: {
    includes: ["transferencia", "bizum", "trf"],
    type: "expense",
  },
};

export function categorizeTransaction({
  concept,
  observations,
  amount,
}: {
  concept: string;
  observations?: string | null;
  amount: number;
}): { category: string; type: TransactionType } {
  if (amount > 0) {
    return { category: "ingresos", type: "income" };
  }

  const haystack = `${concept ?? ""} ${observations ?? ""}`.toLowerCase();

  for (const [category, data] of Object.entries(CATEGORY_KEYWORDS)) {
    if (data.includes.some((needle) => haystack.includes(needle))) {
      return { category, type: data.type };
    }
  }

  return { category: "otros", type: amount >= 0 ? "income" : "expense" };
}



