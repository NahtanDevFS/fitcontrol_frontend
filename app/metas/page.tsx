// app/metas/page.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Swal from "sweetalert2";
import { useTheme } from "@/components/ThemeContext";
import "./metas.css";

// --- TIPOS ---
interface UserInfo {
  id: string;
}
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
type UnidadPeso = "kg" | "lbs";

const KG_TO_LBS = 2.20462;

// --- COMPONENTE PRINCIPAL ---
export default function MetasPage() {
  const [progresoActivo, setProgresoActivo] = useState<Progreso | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [unidadPeso, setUnidadPeso] = useState<UnidadPeso>("kg"); // Estado para la preferencia

  const { darkMode } = useTheme();

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
    // Obtenemos los datos del progreso y la preferencia de unidad en paralelo
    const { data: progresoData } = await supabase
      .from("progreso_usuario")
      .select("*")
      .eq("id_usuario", id)
      .eq("estado", 1)
      .maybeSingle();
    const { data: usuarioData } = await supabase
      .from("usuario")
      .select("unidad_peso")
      .eq("id_usuario", id)
      .single();

    if (usuarioData?.unidad_peso) {
      setUnidadPeso(usuarioData.unidad_peso as UnidadPeso);
    }

    setProgresoActivo(progresoData);
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
          unidadPeso={unidadPeso}
          onMetaCambiada={() => fetchProgresoActivo(userId)}
          darkMode={darkMode}
        />
      ) : (
        <CreateGoalForm
          userId={userId}
          unidadPeso={unidadPeso}
          onMetaCreada={() => fetchProgresoActivo(userId)}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

// --- SUB-COMPONENTE: FORMULARIO PARA CREAR META (ACTUALIZADO) ---
function CreateGoalForm({
  userId,
  unidadPeso,
  onMetaCreada,
  darkMode,
}: {
  userId: string;
  unidadPeso: UnidadPeso;
  onMetaCreada: () => void;
  darkMode: boolean;
}) {
  const [pesoActual, setPesoActual] = useState("");
  const [pesoDeseado, setPesoDeseado] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let pa = parseFloat(pesoActual);
    let pd = parseFloat(pesoDeseado);

    const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };

    if (isNaN(pa) || isNaN(pd) || pa <= 0 || pd <= 0) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Datos incorrectos",
        text: "Por favor, ingresa valores de peso válidos y mayores a cero.",
        confirmButtonColor: "#ffe70e",
      });
      setLoading(false);
      return;
    }

    if (pa === pd) {
      Swal.fire({
        ...swalTheme,
        icon: "warning",
        title: "Meta no válida",
        text: "Tu peso actual y tu peso objetivo no pueden ser iguales.",
        confirmButtonColor: "#ffe70e",
      });
      setLoading(false);
      return;
    }

    // --- CONVERSIÓN CLAVE ---
    // Si la unidad es libras, convertimos a kg antes de guardar
    if (unidadPeso === "lbs") {
      pa = pa / KG_TO_LBS;
      pd = pd / KG_TO_LBS;
    }

    const objetivo = pd < pa ? "bajar" : "subir";

    const { error } = await supabase.from("progreso_usuario").insert({
      id_usuario: userId,
      peso_actual: pa,
      peso_deseado: pd,
      objetivo,
      estado: 1,
      peso_inicial: pa,
    });

    if (error) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Oops...",
        text: "Error al crear la meta: " + error.message,
        confirmButtonColor: "#ffe70e",
      });
    } else {
      Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "¡Meta creada!",
        text: "Tu nuevo objetivo ha sido guardado. ¡A por ello!",
        confirmButtonColor: "#ffe70e",
      });
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
          <label htmlFor="peso-actual">Mi Peso Actual ({unidadPeso})</label>
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
          <label htmlFor="peso-deseado">Mi Peso Objetivo ({unidadPeso})</label>
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

// --- SUB-COMPONENTE: VISTA DE PROGRESO ACTUAL (ACTUALIZADO) ---
function ProgressTracker({
  progreso,
  unidadPeso,
  onMetaCambiada,
  darkMode,
}: {
  progreso: Progreso;
  unidadPeso: UnidadPeso;
  onMetaCambiada: () => void;
  darkMode: boolean;
}) {
  // Convertimos el peso de la BD a la unidad preferida para mostrarlo
  const pesoActualKg = progreso.peso_actual;
  const pesoActualInicial =
    unidadPeso === "lbs"
      ? (pesoActualKg * KG_TO_LBS).toFixed(1)
      : pesoActualKg.toString();

  const [nuevoPeso, setNuevoPeso] = useState(pesoActualInicial);
  const [loading, setLoading] = useState(false);

  const { peso_inicial, peso_actual, peso_deseado, objetivo } = progreso;

  // Lógica de conversión para mostrar los datos
  const pesoInicialMostrado =
    unidadPeso === "lbs" ? (peso_inicial * KG_TO_LBS).toFixed(1) : peso_inicial;
  const pesoActualMostrado =
    unidadPeso === "lbs" ? (peso_actual * KG_TO_LBS).toFixed(1) : peso_actual;
  const pesoDeseadoMostrado =
    unidadPeso === "lbs" ? (peso_deseado * KG_TO_LBS).toFixed(1) : peso_deseado;

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

  const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };

  const handleUpdatePeso = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    let pa = parseFloat(nuevoPeso);

    if (isNaN(pa) || pa <= 0) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error",
        text: "Ingresa un peso válido.",
      });
      setLoading(false);
      return;
    }

    // Convertimos a kg si es necesario antes de actualizar
    if (unidadPeso === "lbs") {
      pa = pa / KG_TO_LBS;
    }

    const { error } = await supabase
      .from("progreso_usuario")
      .update({ peso_actual: pa })
      .eq("id_progreso", progreso.id_progreso);

    if (error) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error",
        text: "No se pudo actualizar el peso: " + error.message,
      });
    } else {
      Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "¡Peso actualizado!",
        showConfirmButton: false,
        timer: 1500,
      });
      onMetaCambiada();
    }
    setLoading(false);
  };

  const handleNuevoObjetivo = async () => {
    // Reemplazamos confirm con Swal
    const result = await Swal.fire({
      ...swalTheme,
      title: "¿Estás seguro?",
      text: "¿Quieres finalizar esta meta y empezar una nueva?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ffe70e",
      cancelButtonColor: "#65676b",
      confirmButtonText: "Sí, empezar una nueva",
      cancelButtonText: "No, cancelar",
    });

    if (result.isConfirmed) {
      setLoading(true);
      const { error } = await supabase
        .from("progreso_usuario")
        .update({ estado: 2, fecha_final_proceso: new Date().toISOString() })
        .eq("id_progreso", progreso.id_progreso);
      if (error) {
        Swal.fire({
          ...swalTheme,
          icon: "error",
          title: "Error",
          text: "No se pudo finalizar la meta: " + error.message,
        });
      } else {
        onMetaCambiada();
      }
      setLoading(false);
    }
  };

  if (metaAlcanzada) {
    return (
      <div className="goal-card goal-completed">
        <h2>¡FELICIDADES! 🥳</h2>
        <p>
          Has alcanzado tu objetivo de {pesoDeseadoMostrado} {unidadPeso}.
          ¡Excelente trabajo!
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
          <strong>
            {pesoInicialMostrado} {unidadPeso}
          </strong>
        </div>
        <div className="current-weight">
          <span>Actual</span>
          <strong>
            {pesoActualMostrado} {unidadPeso}
          </strong>
        </div>
        <div>
          <span>Objetivo</span>
          <strong>
            {pesoDeseadoMostrado} {unidadPeso}
          </strong>
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
          <label htmlFor="nuevo-peso">
            Registrar Nuevo Peso ({unidadPeso})
          </label>
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
