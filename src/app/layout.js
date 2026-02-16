import { Fredoka, Cairo } from "next/font/google";
import "./globals.css";

const fredoka = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-fredoka",
});

const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-cairo",
});

export const metadata = {
  title: "AdminPanel",
  description: "Admin Dashboard",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${fredoka.className} ${cairo.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
