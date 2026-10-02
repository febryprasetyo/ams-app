import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { BRAND_DESCRIPTION, BRAND_NAME } from '@/lib/gajianichBrand';

export const metadata: Metadata = {
  title: `${BRAND_NAME} | ${BRAND_DESCRIPTION}`,
  description: BRAND_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="id"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col bg-[#F8FAFC] text-[#0F172A]">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
