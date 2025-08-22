// app/update-password/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import "@/app/(auth)/reset-password/reset-password.css"; // Reutilizamos los mismos estilos

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSessionReady, setIsSessionReady] = useState(false); // Para esperar la sesión
  const router = useRouter();

  useEffect(() => {
    // Esperamos a que Supabase procese el token de la URL y cree una sesión
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "PASSWORD_RECOVERY") {
          setIsSessionReady(true);
        }
        if (event === "SIGNED_IN") {
          // Puede que se dispare SIGNED_IN también
          setIsSessionReady(true);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const result = await authService.updateUserPassword(password);

    if (result.success) {
      setMessage(
        "¡Contraseña actualizada! Serás redirigido para iniciar sesión."
      );
      setTimeout(() => router.push("/login"), 3000);
    } else {
      setError(result.error || "No se pudo actualizar la contraseña.");
    }
    setLoading(false);
  };

  if (!isSessionReady) {
    return (
      <div className="reset-container">
        <div className="reset-form-box">
          <h1>Verificando...</h1>
          <p>Por favor, espera un momento mientras validamos tu solicitud.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-form-box">
        <h1>Establecer Nueva Contraseña</h1>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="password">Nueva Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <button type="submit" disabled={loading || !!message}>
            {loading ? "Actualizando..." : "Actualizar Contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}
