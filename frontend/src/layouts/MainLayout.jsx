import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";

const MainLayout = () => (
  <>
    <div className="nav-wrap">
      <Navbar />
    </div>
    <main className="page-shell">
      <Outlet />
    </main>
  </>
);

export default MainLayout;