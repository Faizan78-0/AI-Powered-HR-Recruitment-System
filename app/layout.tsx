import type { Metadata } from "next";

import "./globals.css";
import { Geist, Geist_Mono } from "next/font/google";

import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { UserProvider } from "@/context/userContext";
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR-System",
  description: "A hiring process",
  icons: {
    
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en"suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "white9 ",
              color: "#111827",
              padding: "14px 16px",
              borderRadius: "12px",
              fontSize: "14px",
              fontWeight: 500,
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
              border: "1px solid #e5e7eb",
            },
            success: {
              style: {
                background: "#ecfdf5", // green-50
                color: "#065f46", // green-700
                border: "1px solid #10b981",
                boxShadow: "0 4px 20px rgba(16, 185, 129, 0.2)",
              },
              iconTheme: {
                primary: "#10b981",
                secondary: "#d1fae5",
              },
            },
            error: {
              style: {
                background: "#fef2f2", // red-50
                color: "#991b1b", // red-800
                border: "1px solid #ef4444",
                boxShadow: "0 4px 20px rgba(239, 68, 68, 0.2)",
              },
              iconTheme: {
                primary: "#ef4444",
                secondary: "#fee2e2",
              },
            },
          }}
        />
        <UserProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </UserProvider>
      </body>
    </html>
  );
}
