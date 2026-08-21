import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = { title: "Tutorly — знайди свого репетитора", description: "Український маркетплейс репетиторів" };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="uk"><body>{children}</body></html>; }
