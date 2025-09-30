"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import "../reset-password/reset-password.css";
import { Session } from "@supabase/supabase-js";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null); // Estado para guardar el token
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        //Cuando la sesión de recuperación de contraseña está lista
        if (event === "PASSWORD_RECOVERY" && session) {
          setSession(session);
        }
      }
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      setError(
        "Sesión inválida o expirada. Por favor, solicita un nuevo enlace."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    const result = await authService.updateUserPassword(password, session);

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

  if (!session) {
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
