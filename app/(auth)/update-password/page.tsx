"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import "../reset-password/reset-password.css";
import { Session } from "@supabase/supabase-js";

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
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
          <div className="reset-header">
            <Image
              src="/favicon.ico"
              alt="FitControl Logo"
              width={50}
              height={50}
              className="reset-logo"
            />
            <h1>FitControl</h1>
          </div>
          <p className="reset-password-description">Gestiona tu vida Fitness</p>
          <h2>Verificando...</h2>
          <p className="reset-subtitle">
            Por favor, espera un momento mientras validamos tu solicitud.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="reset-container">
      <div className="reset-form-box">
        <div className="reset-header">
          <Image
            src="/favicon.ico"
            alt="FitControl Logo"
            width={50}
            height={50}
            className="reset-logo"
          />
          <h1>FitControl</h1>
        </div>

        <h2>Establecer Nueva Contraseña</h2>
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
