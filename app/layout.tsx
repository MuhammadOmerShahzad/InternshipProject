import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import localFont from "next/font/local";
import { UserProvider } from "@/lib/context/UserContext";
import { ThemeProvider } from "@/lib/context/ThemeContext";
import { IdleTimeoutProvider } from "@/components/providers/IdleTimeoutProvider";
import { Toaster } from "sonner";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cocon = localFont({
  src: "../public/fonts/CoconRegularFont.otf",
  variable: "--font-cocon",
});

export const metadata: Metadata = {
  title: "LOOP",
  description: "Streamline your business operations with LOOP",
  icons: {
    icon: "/images/logos/LOOP_Title (1).png",
    apple: "/images/logos/LOOP_Title (1).png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cocon.variable} antialiased`}
        suppressHydrationWarning
      >
        <ThemeProvider>
          <UserProvider>
            <IdleTimeoutProvider>
              {children}
            </IdleTimeoutProvider>
          </UserProvider>
        </ThemeProvider>
        <Toaster
          position="bottom-right"
          expand={false}
          richColors
          closeButton
          toastOptions={{
            style: {
              borderRadius: '0.5rem',
            },
            classNames: {
              success: 'border-green-500',
              error: 'border-red-500',
              info: 'border-blue-500',
              warning: 'border-orange-500',
            },
          }}
        />
      </body>
    </html>
  );
}
