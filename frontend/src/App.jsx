import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop/ScrollToTop";
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
import Informacoes from "./pages/InformacoesView/Informacoes";
import InformacoesDetail from "./pages/InformacoesView/InformacoesDetail";
import InformacoesNova from "./pages/InformacoesView/InformacoesNova";
import InformacoesEditar from "./pages/InformacoesView/InformacoesEditar";
import NoticiasNova from "./pages/NoticiasView/NoticiasNova";
import NoticiasEditar from "./pages/NoticiasView/NoticiasEditar";
import ResgatesNova from "./pages/ResgatesView/ResgatesNova";
import ResgatesEditar from "./pages/ResgatesView/ResgatesEditar";
import CampanhasNova from "./pages/CampanhasView/CampanhasNova";
import CampanhasEditar from "./pages/CampanhasView/CampanhasEditar";
import NoticiasDetail from "./pages/NoticiasDetailView/NoticiasDetail";
import ResgatesDetail from "./pages/ResgatesDetailView/ResgatesDetail";
import CampanhasDetail from "./pages/CampanhasDetailView/CampanhasDetail";
import Dashboard from "./pages/DashboardView/Dashboard";
import Auditoria from "./pages/AuditoriaView/Auditoria";
import Denuncias from "./pages/DenunciasView/Denuncias";
import Desaparecidos from "./pages/DesaparecidosView/Desaparecidos";
import DesaparecidosNova from "./pages/DesaparecidosView/DesaparecidosNova";
import DesaparecidosEditar from "./pages/DesaparecidosView/DesaparecidosEditar";
import DesaparecidosDetail from "./pages/DesaparecidosDetailView/DesaparecidosDetail";
import Transparencia from "./pages/TransparenciaView/Transparencia";
import NotFound from "./pages/NotFoundView/NotFound";
import Contato from "./pages/ContatoView/Contato";
import MetaConfig from "./pages/MetaConfigView/MetaConfig";
import EsqueciSenha from "./pages/EsqueciSenhaView/EsqueciSenha";
import ResetSenha from "./pages/ResetSenhaView/ResetSenha";
import Perfil from "./pages/PerfilView/Perfil";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";


function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/esqueci-senha" element={<EsqueciSenha />} />
          <Route path="/reset-senha" element={<ResetSenha />} />
          <Route
            path="/perfil"
            element={(
              <ProtectedRoute>
                <Perfil />
              </ProtectedRoute>
            )}
          />
          <Route path="/adocao" element={<Adocao />} />
          <Route path="/adocao/:id" element={<AnimalDetail />} />
          <Route path="/doe" element={<Doe />} />
          <Route path="/informacoes" element={<Informacoes />} />
          <Route path="/informacoes/:categoria/nova" element={<InformacoesNova />} />
          <Route path="/informacoes/:categoria/:id/editar" element={<InformacoesEditar />} />
          <Route path="/informacoes/:categoria/:id" element={<InformacoesDetail />} />
          <Route path="/noticias" element={<Noticias />} />
          <Route path="/noticias/:id" element={<NoticiasDetail />} />
          <Route path="/noticias/:categoria/nova" element={<NoticiasNova />} />
          <Route path="/noticias/:categoria/:id/editar" element={<NoticiasEditar />} />
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
          <Route path="/denuncias" element={<Denuncias />} />
          <Route path="/desaparecidos" element={<Desaparecidos />} />
          <Route path="/desaparecidos/nova" element={<DesaparecidosNova />} />
          <Route path="/desaparecidos/:id/editar" element={<DesaparecidosEditar />} />
          <Route path="/desaparecidos/:id" element={<DesaparecidosDetail />} />
          <Route path="/transparencia" element={<Transparencia />} />
          <Route path="/contato" element={<Contato />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/auditoria"
            element={(
              <ProtectedRoute>
                <Auditoria />
              </ProtectedRoute>
            )}
          />
          <Route
            path="/meta/configurar"
            element={(
              <ProtectedRoute>
                <MetaConfig />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
