import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "./app/providers/AppProviders";
import AppRouter from "./app/router/AppRouter";

const App = () => (
  <BrowserRouter>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </BrowserRouter>
);

export default App;