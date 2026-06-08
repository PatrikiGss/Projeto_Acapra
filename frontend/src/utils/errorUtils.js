export function getApiErrorMessage(error, fallback = "Não foi possível concluir a operação.") {
  const data = error?.response?.data;

  if (!data) {
    return fallback;
  }

  if (typeof data === "string") {
    return data;
  }

  if (typeof data === "object") {
    if (Array.isArray(data.detail) && data.detail.length > 0) {
      return data.detail.join(" ");
    }

    if (typeof data.detail === "string") {
      return data.detail;
    }

    const mensagens = Object.values(data)
      .flatMap((value) => (Array.isArray(value) ? value : [value]))
      .filter((value) => typeof value === "string" && value.trim().length > 0);

    if (mensagens.length > 0) {
      return mensagens.join(" ");
    }
  }

  return fallback;
}
