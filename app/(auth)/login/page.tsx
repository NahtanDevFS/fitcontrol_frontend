"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { authService } from "@/lib/api";
import "./login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await authService.login(email, password);

    if (result.success && result.data?.session) {
      // Guardar token en localStorage
      localStorage.setItem("authToken", result.data.session.access_token);
      localStorage.setItem("userFitControl", JSON.stringify(result.data.user));
      router.push("/dashboard");
    } else {
      setError(result.error || "Credenciales incorrectas");
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-form-box">
        <div className="login-header">
          <Image
            src="/favicon.ico"
            alt="FitControl Logo"
            width={50}
            height={50}
            className="login-logo"
          />
          <h1>FitControl</h1>
        </div>
        <p className="login-description">Gestiona tu vida Fitness</p>

        <h2>Iniciar Sesión</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Correo Electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Cargando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="register-link">
          ¿No tienes cuenta? <a href="/register">Regístrate aquí</a>
        </p>
        <p className="register-link">
          ¿Olvidaste tu contraseña?{" "}
          <a href="/reset-password">Recupérala aquí</a>
        </p>
      </div>
    </div>
  );
}
