"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import "./confirmation.css";

export default function ConfirmacionPage() {
  const [message, setMessage] = useState(
    "Verificando tu correo, por favor espera..."
  );
  const [isVerified, setIsVerified] = useState(false);
  const router = useRouter();

  useEffect(() => {
    //onAuthStateChange es la forma más robusta de manejar eventos de autenticación
    //Se activa automáticamente cuando el cliente de Supabase detecta el token en la URL
    //y completa el proceso de inicio de sesión.
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        //Nos interesa el evento 'SIGNED_IN', que se dispara tras la confirmación del correo.
        if (event === "SIGNED_IN" && session) {
          try {
            //Actualizamos el estado en nuestra tabla 'usuario' para marcarlo como activo.
            const { error: updateError } = await supabase
              .from("usuario")
              .update({ estado: 1 }) // 1 = activo
              .eq("id_usuario", session.user.id);

            if (updateError) {
              //si la actualización falla, lanzamos el error para que lo capture el catch.
              throw updateError;
            }

            //si todo fue exitoso, actualizamos la UI.
            setIsVerified(true);
            setMessage(
              "¡Correo verificado exitosamente! Redirigiendo a inicio de sesión..."
            );

            //Programamos la redirección.
            setTimeout(() => {
              router.push("/dashboard");
            }, 3000); //3 segundos de espera
          } catch (error) {
            console.error("Error al actualizar el estado del usuario:", error);
            setMessage(
              "Hubo un error al activar tu cuenta. Por favor, contacta a soporte."
            );
          }
        }
      }
    );

    //Es una buena práctica limpiar el "oyente" cuando el componente se desmonta.
    return () => {
      authListener.subscription.unsubscribe();
    };
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
            Ir al inicio de sesión
          </button>
        )}
      </div>
    </div>
  );
}
