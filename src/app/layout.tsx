import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Polla Mundial Predictor",
  description: "Predicciones probabilísticas de marcadores para la Polla del Mundial."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
