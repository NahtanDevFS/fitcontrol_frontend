// app/metas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import "./metas.css";

// --- TIPOS ---
interface UserInfo {
  id: string;
  nombre: string;
  email: string;
}

// CORREGIDO: 'peso_inicial' ahora es un campo obligatorio en nuestra lógica.
interface Progreso {
  id_progreso: number;
  id_usuario: string;
  fecha_inicio_proceso: string;
  fecha_final_proceso: string | null;
  peso_actual: number;
  peso_deseado: number;
  objetivo: "bajar" | "subir";
  estado: number;
  peso_inicial: number;
}

// --- COMPONENTE PRINCIPAL ---
export default function MetasPage() {
  const [progresoActivo, setProgresoActivo] = useState<Progreso | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("userFitControl");
    if (storedUser) {
      const userData: UserInfo = JSON.parse(storedUser);
      setUserId(userData.id);
    } else {
      console.error(
        "No se encontró información del usuario. Redirigiendo al login..."
      );
      window.location.href = "/login";
    }
  }, []);

  const fetchProgresoActivo = async (id: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("progreso_usuario")
      .select("*")
      .eq("id_usuario", id)
      .eq("estado", 1)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error al buscar meta activa:", error);
    }

    setProgresoActivo(data); // El 'data' ahora incluirá 'peso_inicial'
    setLoading(false);
  };

  useEffect(() => {
    if (userId) {
      fetchProgresoActivo(userId);
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="metas-container">
        <p>Cargando tu progreso...</p>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="metas-container">
        <p>Verificando usuario...</p>
      </div>
    );
  }

  return (
    <div className="metas-container">
      <header className="page-header">
        <h1>Mi Progreso</h1>
      </header>

      {progresoActivo ? (
        <ProgressTracker
          progreso={progresoActivo}
          onMetaCambiada={() => fetchProgresoActivo(userId)}
        />
      ) : (
        <CreateGoalForm
          userId={userId}
          onMetaCreada={() => fetchProgresoActivo(userId)}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTE: FORMULARIO PARA CREAR META ---
function CreateGoalForm({
  userId,
  onMetaCreada,
}: {
  userId: string;
  onMetaCreada: () => void;
}) {
  const [pesoActual, setPesoActual] = useState("");
  const [pesoDeseado, setPesoDeseado] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const pa = parseFloat(pesoActual);
    const pd = parseFloat(pesoDeseado);

    if (isNaN(pa) || isNaN(pd) || pa <= 0 || pd <= 0) {
      alert("Por favor, ingresa valores de peso válidos.");
      setLoading(false);
      return;
    }

    const objetivo = pd < pa ? "bajar" : "subir";

    // --- CORRECCIÓN CLAVE ---
    // Ahora insertamos explícitamente el 'peso_inicial'
    const { error } = await supabase.from("progreso_usuario").insert({
      id_usuario: userId,
      peso_actual: pa,
      peso_deseado: pd,
      objetivo,
      estado: 1,
      peso_inicial: pa, // Guardamos el peso actual como el peso inicial
    });

    if (error) {
      alert("Error al crear la meta: " + error.message);
    } else {
      alert("¡Meta creada exitosamente! ¡A por ello!");
      onMetaCreada();
    }
    setLoading(false);
  };

  return (
    <div className="goal-card">
      <h2>Define tu Meta</h2>
      <p>
        Establece tu punto de partida y tu objetivo para empezar a medir tu
        progreso.
      </p>
      <form onSubmit={handleSubmit} className="goal-form">
        <div className="form-group">
          <label htmlFor="peso-actual">Mi Peso Actual (kg)</label>
          <input
            id="peso-actual"
            type="number"
            step="0.1"
            value={pesoActual}
            onChange={(e) => setPesoActual(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="peso-deseado">Mi Peso Objetivo (kg)</label>
          <input
            id="peso-deseado"
            type="number"
            step="0.1"
            value={pesoDeseado}
            onChange={(e) => setPesoDeseado(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Guardando..." : "Empezar mi Progreso"}
        </button>
      </form>
    </div>
  );
}

// --- SUB-COMPONENTE: VISTA DE PROGRESO ACTUAL ---
// Este componente ahora funciona correctamente porque 'peso_inicial' es un valor fijo.
function ProgressTracker({
  progreso,
  onMetaCambiada,
}: {
  progreso: Progreso;
  onMetaCambiada: () => void;
}) {
  const [nuevoPeso, setNuevoPeso] = useState(progreso.peso_actual.toString());
  const [loading, setLoading] = useState(false);

  const { peso_inicial, peso_actual, peso_deseado, objetivo } = progreso;

  const totalNecesario = Math.abs(peso_inicial - peso_deseado);
  const progresoHecho =
    objetivo === "bajar"
      ? peso_inicial - peso_actual
      : peso_actual - peso_inicial;
  const porcentajeProgreso =
    totalNecesario > 0
      ? Math.min(Math.max((progresoHecho / totalNecesario) * 100, 0), 100)
      : 0;

  const metaAlcanzada =
    (objetivo === "bajar" && peso_actual <= peso_deseado) ||
    (objetivo === "subir" && peso_actual >= peso_deseado);

  const handleUpdatePeso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const pa = parseFloat(nuevoPeso);

    if (isNaN(pa) || pa <= 0) {
      alert("Ingresa un peso válido.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("progreso_usuario")
      .update({ peso_actual: pa })
      .eq("id_progreso", progreso.id_progreso);

    if (error) {
      alert("Error al actualizar el peso: " + error.message);
    } else {
      alert("¡Peso actualizado!");
      onMetaCambiada();
    }
    setLoading(false);
  };

  const handleNuevoObjetivo = async () => {
    if (
      !confirm("¿Seguro que quieres finalizar esta meta y empezar una nueva?")
    )
      return;
    setLoading(true);
    const { error } = await supabase
      .from("progreso_usuario")
      .update({ estado: 2, fecha_final_proceso: new Date().toISOString() })
      .eq("id_progreso", progreso.id_progreso);

    if (error) {
      alert("Error al finalizar la meta: " + error.message);
    } else {
      onMetaCambiada();
    }
    setLoading(false);
  };

  if (metaAlcanzada) {
    return (
      <div className="goal-card goal-completed">
        <h2>¡FELICIDADES! 🥳</h2>
        <p>
          Has alcanzado tu objetivo de {peso_deseado} kg. ¡Excelente trabajo!
        </p>
        <button
          className="btn btn-primary"
          onClick={handleNuevoObjetivo}
          disabled={loading}
        >
          Empezar un Nuevo Objetivo
        </button>
      </div>
    );
  }

  return (
    <div className="goal-card">
      <h2>
        Tu Meta Actual:{" "}
        {objetivo === "bajar" ? "Bajar de Peso" : "Subir de Peso"}
      </h2>

      <div className="progress-details">
        <div>
          <span>Inicial</span>
          <strong>{peso_inicial} kg</strong>
        </div>
        <div className="current-weight">
          <span>Actual</span>
          <strong>{peso_actual} kg</strong>
        </div>
        <div>
          <span>Objetivo</span>
          <strong>{peso_deseado} kg</strong>
        </div>
      </div>

      <div className="progress-bar-container">
        <div
          className="progress-bar"
          style={{ width: `${porcentajeProgreso}%` }}
        >
          {porcentajeProgreso.toFixed(1)}%
        </div>
      </div>

      <form onSubmit={handleUpdatePeso} className="update-form">
        <div className="form-group">
          <label htmlFor="nuevo-peso">Registrar Nuevo Peso (kg)</label>
          <input
            id="nuevo-peso"
            type="number"
            step="0.1"
            value={nuevoPeso}
            onChange={(e) => setNuevoPeso(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="btn btn-secondary" disabled={loading}>
          {loading ? "Actualizando..." : "Actualizar Peso"}
        </button>
      </form>

      <button className="btn-link" onClick={handleNuevoObjetivo}>
        Empezar un nuevo objetivo
      </button>
    </div>
  );
}
