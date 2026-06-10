import { useParams } from "react-router-dom";
import NewsForm from "../../components/NewsForm/NewsForm";

function NoticiasNova() {
  const { categoria } = useParams();
  return <NewsForm categoria={categoria} backPath="/noticias" mode="create" />;
}

export default NoticiasNova;
