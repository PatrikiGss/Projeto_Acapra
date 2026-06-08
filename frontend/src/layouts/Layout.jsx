import { Outlet } from "react-router-dom";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import "./layout.css";

function Layout() {
  return (
    <>
      <div className="layout">
        <Header />
        <main>
          
          <Outlet />
        </main>
        <Footer />
      </div>
    </>

  );
}

export default Layout;
