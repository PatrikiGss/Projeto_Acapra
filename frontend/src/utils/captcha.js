// Configuração do CAPTCHA (Cloudflare Turnstile) no frontend.
// A site key é pública e vem do build (VITE_TURNSTILE_SITE_KEY).
// Sem ela, o CAPTCHA fica desativado e o cadastro segue sem o widget.
export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || "";

export const captchaHabilitado = Boolean(TURNSTILE_SITE_KEY);
