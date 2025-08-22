// app/reset-password/page.tsx
"use client";

import { useState } from "react";
import { authService } from "@/lib/api";
import "./reset-password.css"; // Usaremos un CSS compartido

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const result = await authService.sendPasswordResetEmail(email);

    // Siempre mostramos un mensaje genérico por seguridad
    setMessage(
      "Si existe una cuenta con este correo, recibirás un enlace para resetear tu contraseña."
    );
    setLoading(false);
  };

  return (
    <div className="reset-container">
      <div className="reset-form-box">
        <h1>Recuperar Contraseña</h1>
        <p className="reset-subtitle">
          Ingresa tu correo y te enviaremos un enlace para recuperar tu cuenta.
        </p>

        {message && <div className="success-message">{message}</div>}

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
          <button type="submit" disabled={loading}>
            {loading ? "Enviando..." : "Enviar Enlace"}
          </button>
        </form>

        <p className="login-link">
          ¿Recordaste tu contraseña? <a href="/login">Inicia sesión</a>
        </p>
      </div>
    </div>
  );
}
