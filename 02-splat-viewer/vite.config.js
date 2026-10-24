import basicSsl from '@vitejs/plugin-basic-ssl';
import { defineConfig } from 'vite';

// npm run dev:vr serves the page over https on your network, so the Quest browser
// can open it and start VR. Plain npm run dev and npm run check stay on http.
export default defineConfig(({ mode }) => ({
  plugins: mode === 'vr' ? [basicSsl()] : [],
}));
