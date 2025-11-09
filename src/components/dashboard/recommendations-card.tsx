"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

interface RecommendationsCardProps {
  recommendations: string[];
}

export function RecommendationsCard({
  recommendations,
}: RecommendationsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-3xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/20 via-slate-900/40 to-indigo-900/40 p-6 text-cyan-50 shadow-xl shadow-cyan-900/20 backdrop-blur"
    >
      <div className="flex items-center gap-3 text-sm uppercase tracking-[0.2em]">
        <Sparkles className="size-5 text-cyan-200" />
        Próximos pasos
      </div>
      <ul className="mt-4 space-y-3 text-sm text-cyan-50/90">
        {recommendations.map((recommendation, index) => (
          <li
            key={`${recommendation}-${index}`}
            className="rounded-2xl border border-cyan-400/10 bg-cyan-400/10 p-3"
          >
            {recommendation}
          </li>
        ))}
      </ul>
    </motion.div>
  );
}


