"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  CumplimientoDietaDia,
  CumplimientoRutina,
  DashboardData,
} from "@/types";
import "./dashboard.css";
import { dashboardService } from "@/services/DashboardService";

interface UserInfo {
  id: string;
  nombre: string;
}

const KG_TO_LBS = 2.20462;

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      const storedUser = localStorage.getItem("userFitControl");
      if (!storedUser) {
        window.location.href = "/login";
        return;
      }
      const userData: UserInfo = JSON.parse(storedUser);

      //llamada a la API
      const response = await dashboardService.getDashboardData(userData.id);

      if (response.success && response.data) {
        setData(response.data);
      } else {
        console.error(
          "Error al cargar los datos del dashboard:",
          response.error
        );
      }
      setLoading(false);
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Cargando tu dashboard...</p>
      </div>
    );
  }

  //mostrar pesos convertidos
  const pesoActualMostrado =
    data?.unidadPeso === "lbs" && data.pesoActual
      ? (data.pesoActual * KG_TO_LBS).toFixed(1)
      : data?.pesoActual;

  const metaPesoMostrado =
    data?.unidadPeso === "lbs" && data.metaPeso
      ? (data.metaPeso * KG_TO_LBS).toFixed(1)
      : data?.metaPeso;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Bienvenido de vuelta, {data?.nombreUsuario}!</h1>
        <p>Aquí tienes un resumen de tu progreso. ¡Sigue así!</p>
      </header>

      <div className="dashboard-grid">
        <DashboardCard title="Mi Rutina" icon="🏋️" link="/rutina">
          <p className="card-metric">🔥 {data?.rachaRutina} Días de Racha</p>
          <p className="card-description">
            ¡No la rompas! Revisa tu entrenamiento de hoy y marca tus ejercicios
            como completados.
          </p>
        </DashboardCard>

        <DashboardCard title="Mi Dieta" icon="🥗" link="/dieta">
          <p className="card-metric">🥗 {data?.rachaDieta} Días de Racha</p>
          <p className="card-description">
            La nutrición es clave. Registra tus comidas y mantén tu racha de
            alimentación saludable.
          </p>
        </DashboardCard>

        <DashboardCard title="Mi Progreso" icon="📊" link="/metas">
          {data?.pesoActual ? (
            <p className="card-metric">
              {pesoActualMostrado} {data.unidadPeso} <br />
              <span className="metric-subtitle">
                de tu meta de {metaPesoMostrado} {data.unidadPeso}
              </span>
            </p>
          ) : (
            <p className="card-metric">Sin Meta Activa</p>
          )}
          <p className="card-description">
            Define tu meta de peso y actualiza tu progreso para ver tu
            evolución.
          </p>
        </DashboardCard>

        <DashboardCard
          title="Gasto Energético"
          icon="⚡"
          link="/gasto-energetico"
        >
          <p className="card-description" style={{ marginTop: "15px" }}>
            Calcula tus calorías de mantenimiento, déficit o superávit para
            ajustar tu dieta a tus objetivos.
          </p>
        </DashboardCard>
      </div>
    </div>
  );
}

//sub-componente reutilizable para las cards
interface DashboardCardProps {
  title: string;
  icon: string;
  link: string;
  children: React.ReactNode;
}

function DashboardCard({ title, icon, link, children }: DashboardCardProps) {
  return (
    <Link href={link} className="dashboard-card">
      <div className="card-header">
        <span className="card-icon">{icon}</span>
        <h2 className="card-title">{title}</h2>
      </div>
      <div className="card-content">{children}</div>
      <div className="card-footer">Ir al Módulo</div>
    </Link>
  );
}
