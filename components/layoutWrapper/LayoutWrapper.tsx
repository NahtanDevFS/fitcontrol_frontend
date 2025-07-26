"use client";

import { usePathname } from "next/navigation";
import Sidebar, { SidebarMobile } from "@/components/sidebar/Sidebar";
import "./LayoutWrapper.css";
import { ThemeProvider } from "../ThemeContext";
import Header from "../header/Header";
import Footer from "../footer/Footer";

// Rutas públicas donde NO debe aparecer el sidebar
const publicRoutes = ["/login", "/register", "/confirmation", "/"];

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isPublicRoute = publicRoutes.includes(pathname);

  if (isPublicRoute) {
    // Para rutas públicas (login, register, etc.) - sin sidebar
    return <main>{children}</main>;
  }

  // Para rutas protegidas (dashboard, dieta, etc.) - con sidebar
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
      </ThemeProvider>
    </div>
  );
}
