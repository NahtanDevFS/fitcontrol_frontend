"use client";

import { usePathname } from "next/navigation";
import Sidebar, { SidebarMobile } from "@/components/sidebar/Sidebar";
import "./LayoutWrapper.css";
import { ThemeProvider } from "../ThemeContext";
import Header from "../header/Header";
import Footer from "../footer/Footer";
import Chatbot from "../chatbot/Chatbot";

//Rutas públicas donde no debe aparecer el sidebar
const publicRoutes = [
  "/login",
  "/register",
  "/confirmation",
  "/",
  "/reset-password",
  "/update-password",
];

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    return <main>{children}</main>;
  }

  return (
    <div className="layout-container">
      <ThemeProvider>
        <Sidebar />
        <div className="content-container">
          <div className="mobile-header">
            <SidebarMobile />
          </div>
          <Header />
          <main className="main-content">{children}</main>
          <Footer />
        </div>
        <Chatbot />
      </ThemeProvider>
    </div>
  );
}
