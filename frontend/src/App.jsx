import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import ProtectedRoute from "./components/ProtectedRoute/ProtectedRoute";

const Home = lazy(() => import("./pages/HomeView/Home"));
const Register = lazy(() => import("./pages/Register/Register"));
const Login = lazy(() => import("./pages/Login/Login"));
const Adocao = lazy(() => import("./pages/AdocaoView/Adocao"));
const Doe = lazy(() => import("./pages/DoeView/Doe"));
const AnimalDetail = lazy(() => import("./pages/AnimalDetailView/AnimalDetail"));
const Vendas = lazy(() => import("./pages/VendasView/Vendas"));
const ProdutoDetail = lazy(() => import("./pages/ProdutoDetailView/ProdutoDetail"));
const Voluntariado = lazy(() => import("./pages/VoluntariadoView/Voluntariado"));
const Noticias = lazy(() => import("./pages/NoticiasView/Noticias"));
const Resgates = lazy(() => import("./pages/ResgatesView/Resgates"));
const Campanhas = lazy(() => import("./pages/CampanhasView/Campanhas"));
const NoticiasNova = lazy(() => import("./pages/NoticiasView/NoticiasNova"));
const NoticiasEditar = lazy(() => import("./pages/NoticiasView/NoticiasEditar"));
const ResgatesNova = lazy(() => import("./pages/ResgatesView/ResgatesNova"));
const ResgatesEditar = lazy(() => import("./pages/ResgatesView/ResgatesEditar"));
const CampanhasNova = lazy(() => import("./pages/CampanhasView/CampanhasNova"));
const CampanhasEditar = lazy(() => import("./pages/CampanhasView/CampanhasEditar"));
const NoticiasDetail = lazy(() => import("./pages/NoticiasDetailView/NoticiasDetail"));
const ResgatesDetail = lazy(() => import("./pages/ResgatesDetailView/ResgatesDetail"));
const CampanhasDetail = lazy(() => import("./pages/CampanhasDetailView/CampanhasDetail"));
const Dashboard = lazy(() => import("./pages/DashboardView/Dashboard"));
const Transparencia = lazy(() => import("./pages/TransparenciaView/Transparencia"));

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={null}>
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
          <Route path="/transparencia" element={<Transparencia />} />
          <Route
            path="/dashboard"
            element={(
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )}
          />
        </Route>
      </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
