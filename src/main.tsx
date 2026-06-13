import React from "react";
import ReactDOM from "react-dom/client";
import { createHashRouter, RouterProvider } from "react-router";
import App from "./pages/App/App";
import Field from "./pages/Field/Field";

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/field",
    element: <Field />,
  },
]);

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
