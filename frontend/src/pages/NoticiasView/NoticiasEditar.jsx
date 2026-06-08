import { useParams } from "react-router-dom";
import NewsForm from "../../components/NewsForm/NewsForm";

function NoticiasEditar() {
  const { categoria } = useParams();
  return <NewsForm categoria={categoria} backPath="/noticias" mode="edit" />;
}

export default NoticiasEditar;
