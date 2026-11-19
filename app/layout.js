import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/common/ThemeProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Study Planner",
  description: "Study Planner Dashboard",
};

const themeInitScript = `
  try {
    var saved = localStorage.getItem("theme");
    var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    var isDark = saved !== null ? saved === "dark" : prefersDark;
    if (isDark) document.documentElement.classList.add("dark");
  } catch (e) {}
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className={inter.className}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}