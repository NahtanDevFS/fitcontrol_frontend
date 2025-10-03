"use client";

import { useState, useEffect } from "react";
import { useTheme } from "@/components/ThemeContext";
import Swal from "sweetalert2";
import "./gasto-energetico.css";
import { GastoEnergeticoData } from "@/types";
import { energyExpenditureService } from "@/services/EnergyExpenditureService";
import { profileService } from "@/services/ProfileService";

interface UserInfo {
  id: string;
}

type UnidadPeso = "kg" | "lbs";

const nivelesActividad = [
  { label: "Poco o ningún ejercicio", value: 1.2 },
  { label: "Ejercicio ligero (1-3 días/semana)", value: 1.375 },
  { label: "Ejercicio moderado (3-5 días/semana)", value: 1.55 },
  { label: "Ejercicio fuerte (6-7 días/semana)", value: 1.725 },
  { label: "Ejercicio muy fuerte (dos veces al día)", value: 1.9 },
];

const KG_TO_LBS = 2.20462;

export default function GastoEnergeticoPage() {
  const [datosGuardados, setDatosGuardados] =
    useState<GastoEnergeticoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [unidadPeso, setUnidadPeso] = useState<UnidadPeso>("kg");

  const { darkMode } = useTheme();

  useEffect(() => {
    const checkUserAndData = async () => {
      const storedUser = localStorage.getItem("userFitControl");
      if (!storedUser) {
        window.location.href = "/login";
        return;
      }
      const userData: UserInfo = JSON.parse(storedUser);
      setUserId(userData.id);

      const [gastoResponse, profileResponse] = await Promise.all([
        energyExpenditureService.getGastoEnergetico(userData.id),
        profileService.getProfileData(userData.id),
      ]);

      if (profileResponse.success && profileResponse.data) {
        setUnidadPeso(profileResponse.data.unidad_peso);
      }

      if (gastoResponse.success && gastoResponse.data) {
        setDatosGuardados(gastoResponse.data);
        setShowForm(false);
      } else {
        setShowForm(true);
      }
      setLoading(false);
    };
    checkUserAndData();
  }, []);

  const handleSuccess = (newData: GastoEnergeticoData) => {
    setDatosGuardados(newData);
    setShowForm(false);
  };

  if (loading) {
    return (
      <div className="ge-container">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="ge-container">
      <header className="page-header-ge">
        <h1>Mi estado calórico</h1>
        {datosGuardados && !showForm && (
          <button
            className="btn btn-secondary"
            onClick={() => setShowForm(true)}
          >
            Volver a calcular
          </button>
        )}
      </header>

      {showForm || !datosGuardados ? (
        <CalculationForm
          userId={userId!}
          initialData={datosGuardados}
          unidadPeso={unidadPeso}
          onSuccess={handleSuccess}
          darkMode={darkMode}
        />
      ) : (
        <ResultsDisplay data={datosGuardados} unidadPeso={unidadPeso} />
      )}
    </div>
  );
}

function CalculationForm({
  userId,
  initialData,
  unidadPeso,
  onSuccess,
  darkMode,
}: {
  userId: string;
  initialData: GastoEnergeticoData | null;
  unidadPeso: UnidadPeso;
  onSuccess: (data: GastoEnergeticoData) => void;
  darkMode: boolean;
}) {
  const [sexo, setSexo] = useState(initialData?.sexo || "hombre");
  const [edad, setEdad] = useState(initialData?.edad || "");
  const [altura, setAltura] = useState(initialData?.altura_cm || "");
  const [peso, setPeso] = useState(() => {
    if (!initialData) return "";
    return unidadPeso === "lbs"
      ? (initialData.peso_kg * KG_TO_LBS).toFixed(2)
      : initialData.peso_kg.toFixed(2);
  });
  const [actividad, setActividad] = useState(
    initialData?.nivel_actividad || 1.2
  );
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };

    let nPesoKg = Number(peso);

    //Si es libras convierte el valor del input a kg
    if (unidadPeso === "lbs") {
      nPesoKg = Number(peso) / KG_TO_LBS;
    }

    const payload = {
      id_usuario: userId,
      sexo: sexo as "hombre" | "mujer",
      edad: Number(edad),
      altura_cm: Number(altura),
      peso_kg: nPesoKg,
      nivel_actividad: Number(actividad),
    };

    const response = await energyExpenditureService.upsertGastoEnergetico(
      payload
    );

    if (response.success && response.data) {
      Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "¡Calculado!",
        text: "Tus datos han sido guardados.",
      });
      onSuccess(response.data);
    } else {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error",
        text: "No se pudieron guardar los datos: " + response.error,
      });
    }
    setLoading(false);
  };

  return (
    <div className="calculation-card">
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group">
            <label>Sexo</label>
            <select
              value={sexo}
              onChange={(e) => setSexo(e.target.value as any)}
            >
              <option value="hombre">Hombre</option>
              <option value="mujer">Mujer</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="edad">Edad</label>
            <input
              id="edad"
              type="number"
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="altura">Altura (cm)</label>
            <input
              id="altura"
              type="number"
              value={altura}
              onChange={(e) => setAltura(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="peso">Peso ({unidadPeso})</label>
            <input
              id="peso"
              type="number"
              step="0.1"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
              required
            />
          </div>
          <div className="form-group full-width">
            <label>Nivel de Actividad Física</label>
            <select
              value={actividad}
              onChange={(e) => setActividad(Number(e.target.value))}
            >
              {nivelesActividad.map((nivel) => (
                <option key={nivel.value} value={nivel.value}>
                  {nivel.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Calculando..." : "Calcular y Guardar"}
        </button>
      </form>
    </div>
  );
}

function ResultsDisplay({
  data,
  unidadPeso,
}: {
  data: GastoEnergeticoData;
  unidadPeso: UnidadPeso;
}) {
  const pesoActualMostrado =
    unidadPeso === "lbs"
      ? (data.peso_kg * KG_TO_LBS).toFixed(2)
      : data.peso_kg.toFixed(2);
  const pesoIdealMostrado =
    unidadPeso === "lbs"
      ? (data.peso_ideal_kg * KG_TO_LBS).toFixed(2)
      : data.peso_ideal_kg.toFixed(2);

  return (
    <div className="results-container">
      <div className="result-card main-result">
        <h3>Calorías de Mantenimiento</h3>
        <p className="calorie-value">
          {data.calorias_mantener} <span>kcal/día</span>
        </p>
        <small>
          Para mantener tu peso actual ({pesoActualMostrado} {unidadPeso}).
        </small>
      </div>
      <div className="result-grid">
        <div className="result-card">
          <h3>Déficit Calórico</h3>
          <p className="calorie-value">
            {data.calorias_deficit} <span>kcal/día</span>
          </p>
          <small>Para perder peso.</small>
        </div>
        <div className="result-card">
          <h3>Superávit Calórico</h3>
          <p className="calorie-value">
            {data.calorias_superavit} <span>kcal/día</span>
          </p>
          <small>Para ganar masa muscular.</small>
        </div>
        <div className="result-card">
          <h3>Tasa Metabólica Basal</h3>
          <p className="calorie-value">
            {data.tmb} <span>kcal/día</span>
          </p>
          <small>Calorías que quemas en reposo total.</small>
        </div>
        <div className="result-card">
          <h3>Peso Ideal Estimado</h3>
          <p className="calorie-value">
            {pesoIdealMostrado} <span>{unidadPeso}</span>
          </p>
          <small>Según la fórmula de Devine.</small>
        </div>
      </div>
    </div>
  );
}
