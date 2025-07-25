"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./confirmation.css"; // Archivo CSS vanilla que crearemos

export default function ConfirmacionPage() {
  const [message, setMessage] = useState("Verificando tu correo...");
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          throw error || new Error("No se pudo verificar la sesión");
        }

        // Actualizar estado en tu tabla usuario
        const { error: updateError } = await supabase
          .from("usuario")
          .update({ estado: 1 }) // 1 = activo
          .eq("id_usuario", data.session.user.id);

        if (updateError) throw updateError;

        setIsVerified(true);
        setMessage("¡Correo verificado exitosamente!");
        setTimeout(() => router.push("/dashboard"), 3000);
      } catch (error) {
        console.error("Error en verificación:", error);
        setMessage(
          "Error al verificar tu correo. Por favor intenta nuevamente."
        );
      }
    };

    verifyEmail();
  }, [router]);

  return (
    <div className="confirmation-container">
      <div className="confirmation-box">
        <h1 className="confirmation-title">
          {isVerified ? "✅ Verificación Exitosa" : "⏳ Verificando"}
        </h1>
        <p className="confirmation-message">{message}</p>
        {isVerified && (
          <button
            onClick={() => router.push("/dashboard")}
            className="confirmation-button"
          >
            Ir al Dashboard
          </button>
        )}
      </div>
    </div>
  );
}
