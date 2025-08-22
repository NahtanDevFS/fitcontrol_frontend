"use client";

import { useState } from "react";
import { Rutina } from "@/types";

interface RoutineCardProps {
  rutina: Rutina;
  onEdit: (rutina: Rutina) => void;
  onDelete: (rutinaId: number) => void;
}

export default function RoutineCard({
  rutina,
  onEdit,
  onDelete,
}: RoutineCardProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const diasSemana = rutina.dias.map((d) => d.dia_semana).join(", ");

  return (
    <div className="routine-card">
      <div className="routine-card-header">
        <h2>{rutina.nombre_rutina}</h2>
        <p className="routine-card-description">
          {diasSemana || "Sin días asignados"}
        </p>
      </div>
      <div className="routine-card-content">
        <button
          className="routine-card-details-toggle"
          onClick={() => setDetailsVisible(!detailsVisible)}
        >
          {detailsVisible ? "Ocultar detalles" : "Ver detalles"}
        </button>
        {detailsVisible && (
          <div className="routine-card-details-content">
            {rutina.dias.map((dia) => (
              <div
                key={dia.id_rutina_dia_semana}
                style={{ marginBottom: "15px" }}
              >
                <h4>{dia.dia_semana}</h4>
                <ul>
                  {dia.ejercicios.map((ej) => (
                    <li key={ej.id_rutina_dia_semana_ejercicio}>
                      {ej.ejercicio?.nombre_ejercicio}: {ej.series}x
                      {ej.repeticiones}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="routine-card-footer">
        <button className="btn btn-secondary" onClick={() => onEdit(rutina)}>
          Editar
        </button>
        <button
          className="btn btn-destructive"
          onClick={() => onDelete(rutina.id_rutina)}
        >
          Eliminar
        </button>
      </div>
    </div>
  );
}
