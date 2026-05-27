import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./layouts/Layout";
import Home from "./pages/HomeView/Home";
import Register from "./pages/Register/Register";
import Login from "./pages/Login/Login";
import Adocao from "./pages/AdocaoView/adocao";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/adocao" element={<Adocao />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;