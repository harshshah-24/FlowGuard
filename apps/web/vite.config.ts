import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig(({mode})=>({ base: './', plugins: [react()], build: { target: 'es2022',...(mode==='phase2-test'?{outDir:'../../.vite/phase2-dist',emptyOutDir:true,rollupOptions:{input:{workspace:fileURLToPath(new URL('./index.html',import.meta.url)),phase2:fileURLToPath(new URL('./test/phase2.html',import.meta.url))}}}:{}) } }));
