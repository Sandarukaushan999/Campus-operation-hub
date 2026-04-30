import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./app/providers/AppProviders";
import AppRouter from "./app/router/AppRouter";
import Navbar from "./components/common/Navbar";
import Footer from "./components/common/Footer";

const App = () => (
  <BrowserRouter>
    <AppProviders>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Navbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <AppRouter />
        </div>
        <Footer />
      </div>
    </AppProviders>
  </BrowserRouter>
);

export default App;