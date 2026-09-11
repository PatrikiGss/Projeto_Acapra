import { useParams } from "react-router-dom";
import NewsArticle from "../../components/NewsArticle/NewsArticle";

function InformacoesDetail() {
  const { categoria } = useParams();

  return (
    <NewsArticle
      categoria={categoria}
      backPath="/informacoes"
      basePath="/informacoes"
    />
  );
}

export default InformacoesDetail;
