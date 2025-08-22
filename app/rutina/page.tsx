"use client";

import { useState, useEffect } from "react";
import { routineService } from "@/services/RoutineService";
import { Rutina } from "@/types";
import RoutineCard from "@/components/RoutineCard";
import RoutineForm from "@/components/RoutineForm";
import "./rutina.css"; // Importamos el CSS

// Definimos un tipo para el objeto de usuario guardado en localStorage
interface UserInfo {
  id: string;
  nombre: string;
  email: string;
}

export default function RutinasPage() {
  const [rutinas, setRutinas] = useState<Rutina[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [rutinaParaEditar, setRutinaParaEditar] = useState<Rutina | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Efecto para obtener el ID del usuario al cargar el componente
  useEffect(() => {
    const storedUser = localStorage.getItem("userFitControl");
    if (storedUser) {
      const userData: UserInfo = JSON.parse(storedUser);
      setUserId(userData.id);
    } else {
      // Opcional: Redirigir al login si no hay usuario
      console.error("No se encontró información del usuario.");
    }
  }, []);

  const fetchRutinas = async (id: string) => {
    setLoading(true);
    const response = await routineService.getRutinasByUserId(id);
    if (response.success && response.data) {
      const data = response.data;
      //Nos aseguramos de que 'data' siempre sea un arreglo
      const rutinasComoArray = Array.isArray(data) ? data : [data];
      setRutinas(rutinasComoArray);
    } else {
      console.error("Error al cargar las rutinas:", response.error);
    }
    setLoading(false);
  };

  // Efecto para cargar las rutinas una vez que tenemos el ID del usuario
  useEffect(() => {
    if (userId) {
      fetchRutinas(userId);
    }
  }, [userId]);

  const handleOpenModalParaCrear = () => {
    setRutinaParaEditar(null);
    setIsModalOpen(true);
  };

  const handleOpenModalParaEditar = (rutina: Rutina) => {
    setRutinaParaEditar(rutina);
    setIsModalOpen(true);
  };

  const handleDelete = async (rutinaId: number) => {
    if (
      confirm("¿Estás seguro de que quieres eliminar esta rutina?") &&
      userId
    ) {
      const response = await routineService.deleteRutina(rutinaId);
      if (response.success) {
        fetchRutinas(userId); // Recargar
      } else {
        alert(`Error al eliminar la rutina: ${response.error}`);
      }
    }
  };

  // No renderizar nada hasta que sepamos si hay un usuario
  if (!userId) {
    return <p>Cargando información de usuario...</p>;
  }

  return (
    <div className="rutinas-container">
      <header className="page-header">
        <h1>Mis Rutinas</h1>
        <button className="btn btn-primary" onClick={handleOpenModalParaCrear}>
          Crear Rutina
        </button>
      </header>

      {loading ? (
        <p>Cargando rutinas...</p>
      ) : (
        <div className="rutinas-grid">
          {rutinas.map((rutina) => (
            <RoutineCard
              key={rutina.id_rutina}
              rutina={rutina}
              onDelete={handleDelete}
              onEdit={handleOpenModalParaEditar}
            />
          ))}
        </div>
      )}

      {rutinas.length === 0 && !loading && (
        <div
          style={{
            textAlign: "center",
            padding: "40px",
            border: "2px dashed #444",
            borderRadius: "10px",
          }}
        >
          <h2>No tienes rutinas</h2>
          <p>¡Crea tu primera rutina para empezar a entrenar!</p>
        </div>
      )}

      {isModalOpen && (
        <RoutineForm
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            setIsModalOpen(false);
            if (userId) fetchRutinas(userId); // Recargar
          }}
          userId={userId}
          rutinaExistente={rutinaParaEditar}
        />
      )}
    </div>
  );
}
