import { useEffect, useRef } from "react";
import { TURNSTILE_SITE_KEY } from "../../utils/captcha";

const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

let scriptPromise = null;

function carregarScript() {
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Falha ao carregar o Turnstile."));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

/**
 * Widget Cloudflare Turnstile.
 * - `onVerify(token)` é chamado quando o desafio é resolvido.
 * - `onExpire()` é chamado quando o token expira ou ocorre erro.
 *
 * Sem site key configurada, o componente não renderiza nada.
 */
export default function Turnstile({ onVerify, onExpire }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  // Mantém as callbacks atualizadas sem recriar o widget a cada render.
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  }, [onVerify, onExpire]);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;

    let cancelado = false;

    carregarScript()
      .then(() => {
        if (cancelado || !containerRef.current || !window.turnstile) return;

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: TURNSTILE_SITE_KEY,
          callback: (token) => onVerifyRef.current?.(token),
          "expired-callback": () => onExpireRef.current?.(),
          "error-callback": () => onExpireRef.current?.(),
        });
      })
      .catch(() => onExpireRef.current?.());

    return () => {
      cancelado = true;
      if (widgetIdRef.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch {
          // widget já removido — nada a fazer
        }
      }
    };
  }, []);

  if (!TURNSTILE_SITE_KEY) return null;

  return <div ref={containerRef} className="cf-turnstile-widget" />;
}
