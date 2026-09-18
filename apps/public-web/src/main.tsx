import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import { PhotoAlbum } from "./PhotoAlbum";
import { resolvePhotoSlug } from "./photo-route";
import { App } from "./App";
import "./styles.css";

const photoSlug = resolvePhotoSlug(window.location.pathname, import.meta.env.VITE_INVITATION_SLUG ?? "our-wedding");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {photoSlug ? <PhotoAlbum slug={photoSlug} /> : <App />}
  </StrictMode>,
);
