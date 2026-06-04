import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import Home from "./pages/HomeView/Home";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Adocao from "./pages/AdocaoView/Adocao"
import Doe from "./pages/DoeView/Doe";
import AnimalDetail from "./pages/AnimalDetailView/AnimalDetail";
import Vendas from "./pages/VendasView/Vendas";
import ProdutoDetail from "./pages/ProdutoDetailView/ProdutoDetail";
import Voluntariado from "./pages/VoluntariadoView/Voluntariado";
import Noticias from "./pages/NoticiasView/Noticias";
import Resgates from "./pages/ResgatesView/Resgates";
import Campanhas from "./pages/CampanhasView/Campanhas";
import NoticiasNova from "./pages/NoticiasView/NoticiasNova";
import NoticiasEditar from "./pages/NoticiasView/NoticiasEditar";
import ResgatesNova from "./pages/ResgatesView/ResgatesNova";
import ResgatesEditar from "./pages/ResgatesView/ResgatesEditar";
import CampanhasNova from "./pages/CampanhasView/CampanhasNova";
import CampanhasEditar from "./pages/CampanhasView/CampanhasEditar";
import NoticiasDetail from "./pages/NoticiasDetailView/NoticiasDetail";
import ResgatesDetail from "./pages/ResgatesDetailView/ResgatesDetail";
import CampanhasDetail from "./pages/CampanhasDetailView/CampanhasDetail";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/adocao" element={<Adocao />} />
          <Route path="/adocao/:id" element={<AnimalDetail />} />
          <Route path="/doe" element={<Doe />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/noticias/nova" element={<NoticiasNova />} />
          <Route path="/noticias/:id/editar" element={<NoticiasEditar />} />
          <Route path="/noticias/:id" element={<NoticiasDetail />} />
          <Route path="/resgates" element={<Resgates />} />
          <Route path="/resgates/nova" element={<ResgatesNova />} />
          <Route path="/resgates/:id/editar" element={<ResgatesEditar />} />
          <Route path="/resgates/:id" element={<ResgatesDetail />} />
          <Route path="/campanhas" element={<Campanhas />} />
          <Route path="/campanhas/nova" element={<CampanhasNova />} />
          <Route path="/campanhas/:id/editar" element={<CampanhasEditar />} />
          <Route path="/campanhas/:id" element={<CampanhasDetail />} />
          <Route path="/produtos" element={<Vendas />} />
          <Route path="/produtos/:id" element={<ProdutoDetail />} />
          <Route path="/voluntariado" element={<Voluntariado />} />


        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
