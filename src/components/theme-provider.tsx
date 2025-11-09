"use client";

import type { ComponentProps } from "react";
import { ThemeProvider as NextThemeProvider } from "next-themes";

type ThemeProviderProps = ComponentProps<typeof NextThemeProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      {...props}
    >
      {children}
    </NextThemeProvider>
  );
}


