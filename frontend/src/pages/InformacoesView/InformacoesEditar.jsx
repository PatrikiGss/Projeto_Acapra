import { useParams } from "react-router-dom";
import NewsForm from "../../components/NewsForm/NewsForm";

function InformacoesEditar() {
  const { categoria } = useParams();

  return (
    <NewsForm
      categoria={categoria}
      backPath="/informacoes"
      basePath="/informacoes"
      mode="edit"
    />
  );
}

export default InformacoesEditar;
