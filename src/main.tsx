import { createRoot } from "react-dom/client";
import { CategoriesTagsProvider } from "./contexts/CategoriesTagsContext";
import App from "./App.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <CategoriesTagsProvider>
    <App />
  </CategoriesTagsProvider>
);
