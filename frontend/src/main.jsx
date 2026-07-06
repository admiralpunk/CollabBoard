import { Buffer } from "buffer/"
import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { BrowserRouter } from "react-router-dom"
import App from "./pages/App.jsx"
import ErrorBoundary from "./shared/components/ErrorBoundary.jsx"
import "./shared/index.css"

window.Buffer = Buffer

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </BrowserRouter>
  </StrictMode>
)
