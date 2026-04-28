import Header from "../components/header/header.jsx";
import Footer from "../components/footer/footer.jsx";
import "./layout.css"
import { Outlet } from "react-router-dom";

function Layout({ children }) {
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