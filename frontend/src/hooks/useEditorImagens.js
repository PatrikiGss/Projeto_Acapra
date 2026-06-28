import { useCallback, useEffect, useRef, useState } from "react";
import { getMediaURL } from "../services/api";
import { validateImageFile } from "../utils/upload";

/**
 * Gerencia a edição de imagens de um cadastro de forma padronizada em todo o
 * sistema (adoção, notícias, vendas...).
 *
 * Trabalha sobre o campo `galeria` exposto pela API — uma lista
 * `[{ tipo, id, url }]` onde `tipo` é "principal" (a foto principal) ou
 * "galeria" (imagens adicionais, com `id`). Permite:
 *   - visualizar todas as imagens já cadastradas;
 *   - marcar individualmente quais remover (mantendo as demais);
 *   - adicionar novas imagens sem precisar remover as anteriores.
 *
 * Na hora de salvar, `anexarAoFormData` traduz o estado para o contrato do
 * backend (`foto`, `remover_foto`, `remover_imagens`, `fotos`). Quando a
 * publicação ficaria sem foto principal, a primeira imagem nova é promovida a
 * principal automaticamente.
 */
export function useEditorImagens(limite = 4) {
  const [existentes, setExistentes] = useState([]);
  const [removidos, setRemovidos] = useState(() => new Set());
  const [novas, setNovas] = useState([]);
  const [erro, setErro] = useState("");

  // Espelho das novas imagens para limpar os object URLs sem closures velhas.
  const novasRef = useRef([]);
  useEffect(() => {
    novasRef.current = novas;
  }, [novas]);

  // Revoga os previews pendentes apenas ao desmontar.
  useEffect(() => {
    return () => {
      novasRef.current.forEach((nova) => URL.revokeObjectURL(nova.preview));
    };
  }, []);

  const reiniciar = useCallback((galeria = []) => {
    novasRef.current.forEach((nova) => URL.revokeObjectURL(nova.preview));
    setExistentes(
      (galeria || []).map((item) => ({
        tipo: item.tipo,
        id: item.id,
        url: getMediaURL(item.url),
        key: item.tipo === "principal" ? "principal" : `g:${item.id}`,
      })),
    );
    setRemovidos(new Set());
    setNovas([]);
    setErro("");
  }, []);

  const mantidas = existentes.filter((item) => !removidos.has(item.key)).length;
  const total = mantidas + novas.length;

  const toggleRemover = useCallback((key) => {
    setErro("");
    setRemovidos((anterior) => {
      const proximo = new Set(anterior);
      if (proximo.has(key)) {
        proximo.delete(key);
      } else {
        proximo.add(key);
      }
      return proximo;
    });
  }, []);

  const adicionar = useCallback(
    (fileList) => {
      const lista = Array.from(fileList || []);
      if (!lista.length) return;

      // Só formatos/tamanhos aceitos entram; os demais são recusados e avisados.
      const validas = [];
      const rejeitadas = [];
      for (const file of lista) {
        const erroValidacao = validateImageFile(file);
        if (erroValidacao) {
          rejeitadas.push({ nome: file.name, motivo: erroValidacao });
        } else {
          validas.push(file);
        }
      }

      setNovas((anterior) => {
        const mantidasAtual = existentes.filter((item) => !removidos.has(item.key)).length;
        const espacoLivre = limite - mantidasAtual - anterior.length;

        const mensagens = [];
        if (rejeitadas.length === 1) {
          mensagens.push(`"${rejeitadas[0].nome}" não foi adicionada: ${rejeitadas[0].motivo}`);
        } else if (rejeitadas.length > 1) {
          mensagens.push(`${rejeitadas.length} arquivos foram ignorados (formato ou tamanho não aceito).`);
        }

        if (espacoLivre <= 0) {
          if (validas.length) mensagens.push(`Máximo de ${limite} imagens por cadastro.`);
          setErro(mensagens.join(" "));
          return anterior;
        }

        if (validas.length > espacoLivre) {
          mensagens.push(`Máximo de ${limite} imagens por cadastro (cabem só mais ${espacoLivre}).`);
        }
        setErro(mensagens.join(" "));

        const aceitas = validas.slice(0, espacoLivre).map((file) => ({
          file,
          preview: URL.createObjectURL(file),
          key: `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`,
        }));

        return aceitas.length ? [...anterior, ...aceitas] : anterior;
      });
    },
    [existentes, removidos, limite],
  );

  const removerNova = useCallback((key) => {
    setErro("");
    setNovas((anterior) => {
      const alvo = anterior.find((nova) => nova.key === key);
      if (alvo) URL.revokeObjectURL(alvo.preview);
      return anterior.filter((nova) => nova.key !== key);
    });
  }, []);

  const anexarAoFormData = useCallback(
    (payload) => {
      const principalRemovida = removidos.has("principal");
      const idsRemover = existentes
        .filter((item) => item.tipo === "galeria" && removidos.has(item.key))
        .map((item) => item.id);
      const temPrincipalRestante =
        existentes.some((item) => item.tipo === "principal") && !principalRemovida;

      const arquivosNovos = novas.map((nova) => nova.file);
      let adicionais = arquivosNovos;

      // Sem principal restante: promove a primeira imagem nova a foto principal.
      if (!temPrincipalRestante && arquivosNovos.length > 0) {
        const [promovida, ...resto] = arquivosNovos;
        payload.append("foto", promovida);
        adicionais = resto;
      } else if (principalRemovida) {
        payload.append("remover_foto", "true");
      }

      idsRemover.forEach((id) => payload.append("remover_imagens", id));
      adicionais.forEach((file) => payload.append("fotos", file));
    },
    [existentes, removidos, novas],
  );

  return {
    limite,
    existentes,
    removidos,
    novas,
    erro,
    total,
    temImagens: total > 0,
    reiniciar,
    toggleRemover,
    adicionar,
    removerNova,
    anexarAoFormData,
    setErro,
  };
}

export default useEditorImagens;
