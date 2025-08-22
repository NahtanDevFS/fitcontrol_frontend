"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import "./page.css";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Verificar si estamos en el cliente (navegador)
    if (typeof window !== "undefined") {
      const userFitControl = localStorage.getItem("userFitControl");

      if (!userFitControl) {
        // Si no existe userFitControl, redirigir a /login
        router.push("/login");
      } else {
        // Si existe userFitControl, redirigir a /dashboard
        router.push("/dashboard");
      }
    }
  }, [router]);

  return (
    <div className="page">
      <main className="main">Cargando...</main>
      <footer className="footer"></footer>
    </div>
  );
}
