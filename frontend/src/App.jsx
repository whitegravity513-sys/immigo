import ErrorBoundary from "./components/common/ErrorBoundary.jsx";
import { AppRoutes } from "./routes";
import "./App.css";

export default function App() {
  return (
    <ErrorBoundary>
      <AppRoutes />
    </ErrorBoundary>
  );
}
