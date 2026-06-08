import { useParams } from "react-router-dom";
import NewsForm from "../../components/NewsForm/NewsForm";

function InformacoesNova() {
  const { categoria } = useParams();

  return (
    <NewsForm
      categoria={categoria}
      backPath="/informacoes"
      basePath="/informacoes"
      mode="create"
    />
  );
}

export default InformacoesNova;
