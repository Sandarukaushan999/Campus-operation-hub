import { Outlet } from "react-router-dom";

const MainLayout = () => (
  <main className="page-shell" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
    <Outlet />
  </main>
);

export default MainLayout;