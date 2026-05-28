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
          <Route path="/produtos" element={<Vendas />} />
          <Route path="/produtos/:id" element={<ProdutoDetail />} />
          <Route path="/voluntariado" element={<Voluntariado />} />


        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
