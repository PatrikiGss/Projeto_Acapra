import { useEffect, useState } from "react";
import api from "../services/api";
import { getStoredUser, isLoggedIn, subscribeToAuthChanges } from "../utils/auth";
import { podeGerenciar } from "../utils/permissions";

export function useAdminAccess(modulo) {
  const [usuario, setUsuario] = useState(getStoredUser());
  const [podeEditar, setPodeEditar] = useState(podeGerenciar(modulo, getStoredUser()));

  useEffect(() => {
    const sincronizar = async () => {
      if (!isLoggedIn()) {
        setUsuario(null);
        setPodeEditar(false);
        return;
      }

      const armazenado = getStoredUser();
      setUsuario(armazenado);
      setPodeEditar(podeGerenciar(modulo, armazenado));

      try {
        const response = await api.get("/api/gerenciamento/user/me/");
        setUsuario(response.data);
        setPodeEditar(podeGerenciar(modulo, response.data));
      } catch {
        setPodeEditar(podeGerenciar(modulo, armazenado));
      }
    };

    sincronizar();
    return subscribeToAuthChanges(sincronizar);
  }, [modulo]);

  return { usuario, podeEditar };
}
