"use client";

import { useTheme } from "../ThemeContext";
import "./Footer.css";
import { Mail, Github } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  const { darkMode } = useTheme();

  return (
    <footer className={`footer ${darkMode ? "dark" : "light"}`}>
      <div className="footer-container">
        <div className="contact-info">
          <h3 className="footer-title">Contacto</h3>
          <div className="contact-item">
            <Mail className="contact-icon" />
            <a
              href="mailto:jonathan04franco@gmail.com"
              className="contact-link"
            >
              jonathan04franco@gmail.com
            </a>
          </div>
        </div>

        <div className="social-links">
          <h3 className="footer-title">Redes Sociales</h3>
          <div className="social-icons">
            <Link
              href="https://github.com/NahtanDevFS"
              target="_blank"
              aria-label="GitHub"
              className="social-link"
            >
              <Github className="social-icon" />
            </Link>
          </div>
        </div>
      </div>

      <div className="copyright">© {new Date().getFullYear()} FitControl</div>
    </footer>
  );
}
