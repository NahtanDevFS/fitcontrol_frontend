// app/dieta/page.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Dieta,
  TiempoComida,
  AlimentoDetalle,
  CumplimientoDietaDia,
} from "@/types";
import Swal from "sweetalert2";
import { useTheme } from "@/components/ThemeContext";
import "./dieta.css";
import { dietService } from "@/services/DietService";

//TIPOS
interface UserInfo {
  id: string;
}

interface ModalData {
  dia: string;
  tiempo: string;
  foodToEdit?: AlimentoDetalle; //Prop opcional para editar
}

interface MealStatus extends TiempoComida {
  cumplido: boolean;
}

const DIAS_SEMANA = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];
const TIEMPOS_COMIDA = ["Desayuno", "Almuerzo", "Cena", "Snacks"];

export default function DietaPage() {
  const [dieta, setDieta] = useState<Dieta | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalData, setModalData] = useState<ModalData | null>(null);
  const [racha, setRacha] = useState(0);
  const [calendario, setCalendario] = useState<any[]>([]);

  const { darkMode } = useTheme();

  const fetchDietaCompleta = useCallback(async (currentUserId: string) => {
    setLoading(true);
    const response = await dietService.getDietPlan(currentUserId);
    if (response.success && response.data) {
      setDieta(response.data.dieta);
      setRacha(response.data.racha);
      setCalendario(response.data.calendario);
    } else {
      console.error("Error al cargar el plan de dieta:", response.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const storedUser = localStorage.getItem("userFitControl");
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      setUserId(userData.id);
      fetchDietaCompleta(userData.id);
    } else {
      window.location.href = "/login";
    }
  }, [fetchDietaCompleta]);

  const openAddFoodModal = (dia: string, tiempo: string) => {
    setModalData({ dia, tiempo, foodToEdit: undefined });
    setIsModalOpen(true);
  };

  const openEditFoodModal = (
    dia: string,
    tiempo: string,
    alimento: AlimentoDetalle
  ) => {
    setModalData({ dia, tiempo, foodToEdit: alimento });
    setIsModalOpen(true);
  };

  const handleDeleteFood = async (alimentoId: number) => {
    const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };
    const result = await Swal.fire({
      ...swalTheme,
      title: "¿Estás seguro?",
      text: "No podrás revertir esta acción.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ffe70e",
      cancelButtonColor: "#65676b",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
    });
    if (result.isConfirmed) {
      //llamada al servicio
      const response = await dietService.deleteFood(alimentoId);

      if (!response.success) {
        Swal.fire({
          ...swalTheme,
          icon: "error",
          title: "Error",
          text: "No se pudo eliminar el alimento: " + response.error,
        });
      } else {
        Swal.fire({
          ...swalTheme,
          icon: "success",
          title: "Eliminado",
          text: "El alimento ha sido eliminado.",
          showConfirmButton: false,
          timer: 1500,
        });
        if (userId) fetchDietaCompleta(userId);
      }
    }
  };

  if (loading || !dieta) {
    return (
      <div className="dieta-container">
        <p>Cargando tu plan de dieta...</p>
      </div>
    );
  }

  return (
    <div className="dieta-container">
      <header className="page-header">
        <h1>Mi Dieta y Cumplimiento</h1>
      </header>

      {/* --- NUEVOS COMPONENTES DE CUMPLIMIENTO --- */}
      <DailyDietTracker
        key={`daily-${dieta.id_dieta}`}
        userId={userId!}
        darkMode={darkMode}
        onUpdate={() => fetchDietaCompleta(userId!)}
      />
      <DietStreakTracker
        racha={racha}
        calendario={calendario}
        loading={loading}
      />

      <h2 className="section-title">Editor de Plan Semanal</h2>
      <div className="dieta-grid">
        {DIAS_SEMANA.map((dia) => {
          const totalCaloriasDia = Object.values(dieta.dias[dia] || {})
            .flatMap((meal) => meal.alimentos)
            .reduce((total, alimento) => total + alimento.calorias_alimento, 0);
          return (
            <div key={dia} className="day-column">
              <h3>{dia}</h3>
              <div className="day-total-calories">
                🔥 {totalCaloriasDia.toFixed(0)} kcal totales
              </div>
              {TIEMPOS_COMIDA.map((tiempo) => (
                <div key={tiempo} className="meal-slot">
                  <h4>{tiempo}</h4>
                  <ul>
                    {dieta.dias[dia]?.[tiempo]?.alimentos.map((alimento) => (
                      <li key={alimento.id_dieta_alimento_detalle}>
                        <span className="food-item-name">
                          {alimento.nombre_alimento}
                        </span>
                        <div className="food-item-actions">
                          <span>
                            {alimento.calorias_alimento.toFixed(0)} kcal
                          </span>
                          <button
                            onClick={() =>
                              openEditFoodModal(dia, tiempo, alimento)
                            }
                            className="btn-icon"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteFood(
                                alimento.id_dieta_alimento_detalle!
                              )
                            }
                            className="btn-icon btn-delete"
                          >
                            ❌
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <button
                    className="btn-add-food"
                    onClick={() => openAddFoodModal(dia, tiempo)}
                  >
                    +
                  </button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {isModalOpen && modalData && (
        <AddFoodModal
          dietaId={dieta.id_dieta}
          dayName={modalData.dia}
          mealName={modalData.tiempo}
          foodToEdit={modalData.foodToEdit}
          onClose={() => setIsModalOpen(false)}
          onFoodAdded={() => {
            setIsModalOpen(false);
            fetchDietaCompleta(userId!);
          }}
          darkMode={darkMode}
        />
      )}
    </div>
  );
}

function DailyDietTracker({
  darkMode,
  userId,
  onUpdate,
}: {
  darkMode: boolean;
  userId: string;
  onUpdate: () => void;
}) {
  const [comidasDeHoy, setComidasDeHoy] = useState<any[]>([]);
  const [diaCumplido, setDiaCumplido] = useState(false);
  const [idCumplimientoDia, setIdCumplimientoDia] = useState<number | null>(
    null
  );
  const [loading, setLoading] = useState(true);

  const diasSemanaMapa: { [key: number]: string } = {
    0: "Domingo",
    1: "Lunes",
    2: "Martes",
    3: "Miércoles",
    4: "Jueves",
    5: "Viernes",
    6: "Sábado",
  };
  const hoy = new Date();
  const nombreDiaHoy = diasSemanaMapa[hoy.getDay()];

  const fetchCompliance = useCallback(async () => {
    setLoading(true);
    const response = await dietService.getTodayDietTracker(userId);
    if (response.success && response.data) {
      setComidasDeHoy(response.data.comidasDeHoy);
      setDiaCumplido(response.data.diaCumplido);
      setIdCumplimientoDia(response.data.id_cumplimiento_dia);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    if (userId) {
      fetchCompliance();
    }
  }, [userId, fetchCompliance]);

  const handleCheckMeal = async (meal: any, newStatus: boolean) => {
    // Actualización optimista de la UI (funciona porque 'meal' es ahora el objeto completo)
    setComidasDeHoy((prev) =>
      prev.map((c) =>
        c.id_dieta_alimento === meal.id_dieta_alimento
          ? { ...c, cumplido: newStatus }
          : c
      )
    );
    // Llamada a la API con el ID de cumplimiento correcto
    await dietService.updateMealCompliance(
      meal.id_cumplimiento_dieta,
      newStatus
    );
  };

  const handleMarkDayComplete = async () => {
    const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };
    if (!idCumplimientoDia) return;
    const response = await dietService.updateDayCompliance(
      idCumplimientoDia,
      true
    );
    if (response.success) {
      setDiaCumplido(true);
      onUpdate(); // Recarga los datos de la racha
      Swal.fire({
        ...swalTheme,
        icon: "success",
        title: "¡Felicidades!",
        text: "Has completado tu dieta de hoy.",
        showConfirmButton: false,
        timer: 2000,
      });
    }
  };

  if (loading) {
    return (
      <div className="tracker-container">
        <p>Cargando cumplimiento de dieta...</p>
      </div>
    );
  }

  // 1. Primero, verificamos si el día ya está cumplido.
  //    Si es así, mostramos el mensaje de éxito y terminamos.
  if (diaCumplido) {
    return (
      <div className="tracker-container">
        <h3>Cumplimiento de Hoy: {nombreDiaHoy}</h3>
        <div className="tracker-cumplido">
          <p>🎉 ¡Dieta del día completada! ¡Sigue así! 🎉</p>
        </div>
      </div>
    );
  }

  // 2. Si no está cumplido, AHORA SÍ verificamos si hay comidas.
  //    Si no hay, es un día de descanso o "cheat day".
  if (comidasDeHoy.length === 0) {
    return (
      <div className="tracker-container">
        <h3>Hoy es un Cheat Day</h3>
        <p>No tienes comidas registradas para hoy.</p>
      </div>
    );
  }

  // 3. Si no está cumplido y sí hay comidas, mostramos la lista.
  const allMealsChecked = comidasDeHoy.every((c) => c.cumplido);

  return (
    <div className="tracker-container">
      <h3>Cumplimiento de Hoy: {nombreDiaHoy}</h3>
      <>
        <ul className="meal-checklist">
          {comidasDeHoy.map((comida) => (
            <li
              key={comida.id_dieta_alimento}
              className={comida.cumplido ? "completado" : ""}
            >
              <label>
                <input
                  type="checkbox"
                  checked={comida.cumplido}
                  onChange={(e) => handleCheckMeal(comida, e.target.checked)}
                />
                <span className="meal-name">{comida.tiempo_comida}</span>
              </label>
            </li>
          ))}
        </ul>
        <button
          className="btn btn-primary"
          onClick={handleMarkDayComplete}
          disabled={!allMealsChecked}
          style={{ width: "100%", marginTop: "20px" }}
        >
          Marcar Día como Cumplido
        </button>
      </>
    </div>
  );
}

function DietStreakTracker({
  racha,
  calendario,
  loading,
}: {
  racha: number;
  calendario: any[];
  loading: boolean;
}) {
  const fillerDays = [];
  if (calendario.length > 0) {
    // Se crea un objeto Date para obtener el día de la semana.
    // OJO: Los strings de fecha "YYYY-MM-DD" se interpretan como UTC,
    // por lo que usamos getUTCDay() para obtener el día correcto sin problemas de zona horaria.
    const firstDayOfWeek = new Date(calendario[0].fecha).getUTCDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      fillerDays.push(
        <div key={`filler-${i}`} className="calendar-day-empty"></div>
      );
    }
  }

  return (
    <div className="streak-container">
      <div className="streak-counter">
        <h3>Racha de Dieta</h3>
        {loading ? <p>...</p> : <p className="streak-days">🥗 {racha} Días</p>}
      </div>
      <div className="streak-calendar">
        <div className="calendar-header">
          <span>D</span>
          <span>L</span>
          <span>M</span>
          <span>M</span>
          <span>J</span>
          <span>V</span>
          <span>S</span>
        </div>
        <div className="calendar-grid">
          {fillerDays}
          {calendario.map(({ fecha, status }, index) => (
            <div key={index} className={`calendar-day ${status}`}>
              {parseInt(fecha.split("-")[2], 10)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- subcomponente modal para añadir y editar alimentos ---
interface AddFoodModalProps {
  dietaId: number;
  dayName: string;
  mealName: string;
  foodToEdit?: AlimentoDetalle;
  onClose: () => void;
  onFoodAdded: () => void;
  darkMode: boolean;
}

// --- SUB-COMPONENTE MODAL PARA AÑADIR ALIMENTOS (CON BÚSQUEDA PRIORIZADA) ---
function AddFoodModal({
  dietaId,
  dayName,
  mealName,
  foodToEdit,
  onClose,
  onFoodAdded,
  darkMode,
}: AddFoodModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [nutrition, setNutrition] = useState<any>(null);
  const [quantity, setQuantity] = useState(100);
  const [loading, setLoading] = useState(false);

  const API_KEY = process.env.NEXT_PUBLIC_API_KEY_USDA;

  useEffect(() => {
    if (foodToEdit) {
      // --- LÓGICA DE EDICIÓN MEJORADA ---
      // Recreamos el objeto 'selectedFood' con la estructura que el resto del componente espera.
      // Extraemos el nombre real del alimento del string guardado.
      const nombreReal = foodToEdit.nombre_alimento.replace(/^\d+g\sde\s/, "");
      setSelectedFood({ description: nombreReal });

      setQuantity(foodToEdit.gramos_alimento);

      // Recreamos el objeto de nutrición a partir de los datos guardados por 100g
      const multiplier = foodToEdit.gramos_alimento / 100;
      if (multiplier > 0) {
        setNutrition({
          calories: foodToEdit.calorias_alimento / multiplier,
          protein: foodToEdit.proteina_alimento / multiplier,
          fat: foodToEdit.grasas_alimento / multiplier,
          carbs: foodToEdit.carbohidratos_alimento / multiplier,
        });
      }
    }
  }, [foodToEdit]);

  const swalTheme = { customClass: { popup: darkMode ? "swal-dark" : "" } };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setSelectedFood(null);
    setNutrition(null);
    try {
      let url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(
        query
      )}&dataType=SR%20Legacy&pageSize=10`;
      let response = await fetch(url);
      let data = await response.json();

      if (!data.foods || data.foods.length === 0) {
        url = `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${API_KEY}&query=${encodeURIComponent(
          query
        )}&pageSize=10`;
        response = await fetch(url);
        data = await response.json();
      }
      setResults(data.foods || []);
    } catch (error) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error de Búsqueda",
        text: "No se pudieron obtener los alimentos.",
      });
    }
    setLoading(false);
  };

  const handleSelectFood = async (foodItem: any) => {
    setLoading(true);
    setSelectedFood(foodItem);
    setResults([]);
    const url = `https://api.nal.usda.gov/fdc/v1/food/${foodItem.fdcId}?api_key=${API_KEY}`;

    try {
      const response = await fetch(url);
      const data = await response.json();
      const nutrients = {
        calories:
          data.foodNutrients.find((n: any) => n.nutrient.id === 1008)?.amount ||
          0,
        protein:
          data.foodNutrients.find((n: any) => n.nutrient.id === 1003)?.amount ||
          0,
        fat:
          data.foodNutrients.find((n: any) => n.nutrient.id === 1004)?.amount ||
          0,
        carbs:
          data.foodNutrients.find((n: any) => n.nutrient.id === 1005)?.amount ||
          0,
      };
      setNutrition(nutrients);
    } catch (error) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error de Nutrición",
        text: "No se pudieron obtener los datos nutricionales.",
      });
    }
    setLoading(false);
  };

  const handleSaveFood = async () => {
    if (!nutrition || !selectedFood?.description) {
      // <-- Verificación de seguridad
      Swal.fire({
        ...swalTheme,
        icon: "warning",
        title: "Faltan Datos",
        text: "No hay información nutricional para guardar.",
      });
      return;
    }
    setLoading(true);
    const multiplier = quantity / 100;

    const foodData = {
      nombre_alimento: `${quantity}g de ${selectedFood.description}`,
      calorias_alimento: nutrition.calories * multiplier,
      proteina_alimento: nutrition.protein * multiplier,
      grasas_alimento: nutrition.fat * multiplier,
      carbohidratos_alimento: nutrition.carbs * multiplier,
      gramos_alimento: quantity,
    };

    try {
      let response;
      if (foodToEdit) {
        // --- LLAMADA PARA ACTUALIZAR ---
        response = await dietService.updateFood(
          foodToEdit.id_dieta_alimento_detalle!,
          foodData
        );
      } else {
        // --- LLAMADA PARA CREAR ---
        const payload = {
          ...foodData,
          id_dieta: dietaId,
          dia_semana: dayName,
          tiempo_comida: mealName,
        };
        response = await dietService.addFood(payload);
      }
      if (response.success) {
        Swal.fire({
          ...swalTheme,
          icon: "success",
          title: "¡Guardado!",
          text: `Alimento ${
            foodToEdit ? "actualizado" : "añadido"
          } exitosamente.`,
          showConfirmButton: false,
          timer: 1500,
        });
        onFoodAdded();
      } else {
        throw new Error(response.error);
      }
    } catch (error: any) {
      Swal.fire({
        ...swalTheme,
        icon: "error",
        title: "Error al Guardar",
        text: error.message,
      });
    }
    setLoading(false);
  };

  // Determinamos qué vista mostrar: búsqueda o detalles
  const showDetailsView = selectedFood || foodToEdit;

  return (
    <div className="modal-overlay open" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {foodToEdit ? "Editar" : "Añadir"} Alimento a {mealName} de{" "}
            {dayName}
          </h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>

        {!showDetailsView ? (
          <>
            <form onSubmit={handleSearch} className="food-search-form">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca un alimento (ej: Pollo, Manzana)"
                autoFocus
              />
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Buscando..." : "Buscar"}
              </button>
            </form>
            <ul className="search-results">
              {results.map((food, index) => (
                <li
                  key={food.fdcId || index}
                  onClick={() => handleSelectFood(food)}
                >
                  {food.description}
                  <small className="food-category">{food.dataType}</small>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <div className="nutrition-details">
            {/* --- CORRECCIÓN CLAVE AQUÍ --- */}
            {/* Usamos '?' para acceder de forma segura y un fallback '||' */}
            <h3>{selectedFood?.description || "Detalles del Alimento"}</h3>

            <div className="quantity-selector">
              <label htmlFor="quantity">Cantidad (gramos):</label>
              <input
                id="quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min="1"
                step="1"
              />
            </div>
            {nutrition && (
              <div className="nutrition-facts">
                <h4>Valores Nutricionales (Total):</h4>
                <p>
                  <strong>Calorías:</strong>{" "}
                  {(nutrition.calories * (quantity / 100)).toFixed(0)} kcal
                </p>
                <p>
                  <strong>Proteínas:</strong>{" "}
                  {(nutrition.protein * (quantity / 100)).toFixed(1)} g
                </p>
                <p>
                  <strong>Grasas:</strong>{" "}
                  {(nutrition.fat * (quantity / 100)).toFixed(1)} g
                </p>
                <p>
                  <strong>Carbs:</strong>{" "}
                  {(nutrition.carbs * (quantity / 100)).toFixed(1)} g
                </p>
              </div>
            )}
            <div className="modal-footer">
              {!foodToEdit && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setSelectedFood(null)}
                >
                  Volver a buscar
                </button>
              )}
              <button
                className="btn btn-primary"
                onClick={handleSaveFood}
                disabled={loading}
              >
                {loading
                  ? "Guardando..."
                  : foodToEdit
                  ? "Actualizar Alimento"
                  : "Añadir a mi Dieta"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
