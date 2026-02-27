import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { Toaster } from "sonner";
import UserNavbar from "@/components/UserNavbar";

// ตั้งค่าฟอนต์ Kanit
const kanit = Kanit({ 
  subsets: ["thai", "latin"],
  weight: ["300", "400", "500", "700"], 
});

export const metadata: Metadata = {
  title: "ระบบจองล็อกตลาดนัดคนเดิน จ.ศรีสะเกษ",
  description: "ระบบจองพื้นที่ขายสินค้าออนไลน์",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={kanit.className}>
        <AuthProvider>
          <ThemeProvider>
            <UserNavbar />
            {children}
          {/* ระบบแจ้งเตือน */}
            <Toaster position="top-right" richColors /> 
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}