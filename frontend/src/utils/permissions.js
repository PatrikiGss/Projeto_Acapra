import { getStoredUser } from "./auth";

export const NIVEIS = {
  USUARIO: "usuario",
  AUXILIAR_GERAL: "auxiliar_geral",
  ADMIN: "admin",
  TESOUREIRO: "tesoureiro",
  DIRETOR_ACAPRA: "diretor_acapra",
};

export const NIVEL_LABELS = {
  [NIVEIS.USUARIO]: "Usuário sem vínculo",
  [NIVEIS.AUXILIAR_GERAL]: "Auxiliar Geral",
  [NIVEIS.ADMIN]: "Administrador",
  [NIVEIS.TESOUREIRO]: "Tesoureiro",
  [NIVEIS.DIRETOR_ACAPRA]: "Diretor Acapra",
};

export const NIVEL_OPCOES = [
  { value: NIVEIS.USUARIO, label: NIVEL_LABELS[NIVEIS.USUARIO] },
  { value: NIVEIS.AUXILIAR_GERAL, label: NIVEL_LABELS[NIVEIS.AUXILIAR_GERAL] },
  { value: NIVEIS.ADMIN, label: NIVEL_LABELS[NIVEIS.ADMIN] },
  { value: NIVEIS.TESOUREIRO, label: NIVEL_LABELS[NIVEIS.TESOUREIRO] },
  { value: NIVEIS.DIRETOR_ACAPRA, label: NIVEL_LABELS[NIVEIS.DIRETOR_ACAPRA] },
];

// Espelha MODULOS_POR_NIVEL do backend (gerenciamento/permissions.py).
// Hierarquia: DIRETOR_ACAPRA > TESOUREIRO > ADMIN > AUXILIAR_GERAL > USUARIO.
const TODOS_ADMINS = [
  NIVEIS.DIRETOR_ACAPRA,
  NIVEIS.TESOUREIRO,
  NIVEIS.ADMIN,
  NIVEIS.AUXILIAR_GERAL,
];

const MODULO_ACESSO = {
  doacoes: [NIVEIS.DIRETOR_ACAPRA, NIVEIS.TESOUREIRO],
  noticias: TODOS_ADMINS,
  resgates: TODOS_ADMINS,
  campanhas: TODOS_ADMINS,
  // "desaparecidos" é uma categoria de publicação e segue o módulo de notícias.
  desaparecidos: TODOS_ADMINS,
  adocao: TODOS_ADMINS,
  vendas: TODOS_ADMINS,
  voluntariado: TODOS_ADMINS,
  transparencia: [NIVEIS.DIRETOR_ACAPRA, NIVEIS.TESOUREIRO, NIVEIS.ADMIN],
  denuncias: [NIVEIS.DIRETOR_ACAPRA, NIVEIS.TESOUREIRO, NIVEIS.ADMIN],
  gerenciamento_usuarios: [NIVEIS.DIRETOR_ACAPRA],
};

export function getUserNivel(user = getStoredUser()) {
  if (!user?.perfil_admin?.ativo) {
    return NIVEIS.USUARIO;
  }

  return user.perfil_admin.nivel || NIVEIS.USUARIO;
}

export function getNivelLabel(nivel) {
  return NIVEL_LABELS[nivel] || "Usuário sem vínculo";
}

export function podeGerenciar(modulo, user = getStoredUser()) {
  const nivel = getUserNivel(user);
  return MODULO_ACESSO[modulo]?.includes(nivel) ?? false;
}

export function isDiretor(user = getStoredUser()) {
  return getUserNivel(user) === NIVEIS.DIRETOR_ACAPRA;
}

export function temAcessoDashboard(user = getStoredUser()) {
  return getUserNivel(user) !== NIVEIS.USUARIO;
}
