import { getStoredUser } from "./auth";

export const NIVEIS = {
  USUARIO: "usuario",
  DOACOES: "doacoes",
  FINANCEIRO: "financeiro",
  MASTER: "master",
};

export const NIVEL_LABELS = {
  usuario: "Usuário sem vínculo",
  doacoes: "Doações",
  financeiro: "Financeiro",
  master: "Diretor Acapra",
};

export const NIVEL_OPCOES = [
  { value: "usuario", label: "Usuário sem vínculo" },
  { value: "doacoes", label: "Doações" },
  { value: "financeiro", label: "Financeiro" },
  { value: "master", label: "Diretor Acapra" },
];

const MODULO_ACESSO = {
  doacoes: [NIVEIS.MASTER, NIVEIS.FINANCEIRO],
  noticias: [NIVEIS.MASTER, NIVEIS.DOACOES],
  resgates: [NIVEIS.MASTER],
  campanhas: [NIVEIS.MASTER],
  adocao: [NIVEIS.MASTER, NIVEIS.DOACOES],
  vendas: [NIVEIS.MASTER],
  voluntariado: [NIVEIS.MASTER],
  gerenciamento_usuarios: [NIVEIS.MASTER],
  transparencia: [NIVEIS.MASTER, NIVEIS.FINANCEIRO],
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

export function isMaster(user = getStoredUser()) {
  return getUserNivel(user) === NIVEIS.MASTER;
}

export function temAcessoDashboard(user = getStoredUser()) {
  return getUserNivel(user) !== NIVEIS.USUARIO;
}
