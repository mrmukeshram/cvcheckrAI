import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: mode === 'development' ? {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  } : undefined,
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    sourcemap: false,
    // Enable tree shaking and compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separate large PDF libraries - lazy load these
          if (id.includes('pdfjs-dist') || id.includes('tesseract.js')) {
            return 'pdf-utils';
          }
          // Group common libraries
          if (id.includes('jspdf') || id.includes('docx') || id.includes('mammoth')) {
            return 'doc-utils';
          }
          if (id.includes('lucide-react') || id.includes('gsap') || id.includes('framer-motion')) {
            return 'ui-libs';
          }
          if (id.includes('react') || id.includes('react-dom')) {
            return 'react-vendor';
          }
          if (id.includes('date-fns') || id.includes('next-themes') || id.includes('@tanstack')) {
            return 'misc-utils';
          }
          // Separate Radix UI components into smaller chunks
          if (id.includes('@radix-ui')) {
            return 'radix-ui';
          }
          // Group all react-router related
          if (id.includes('react-router')) {
            return 'router';
          }
        },
      },
    },
    chunkSizeWarningLimit: 1000, // Allow larger chunks for heavy libraries
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'framer-motion',
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      'react-hook-form',
    ],
    exclude: [
      // Exclude heavy libraries from pre-bundling if not immediately needed
      'pdfjs-dist',
      'tesseract.js',
      'mammoth',
      'docx',
    ],
  },
  // Add build analysis for bundle size
  ...(mode === 'analyze' && {
    plugins: [
      react(),
      {
        name: 'bundle-analyzer',
        generateBundle(options, bundle) {
          let totalSize = 0;
          console.log('\n📦 Bundle Analysis:');
          console.log('==================');
          Object.keys(bundle).forEach(fileName => {
            const chunk = bundle[fileName];
            if (chunk.type === 'chunk') {
              const size = chunk.code.length;
              totalSize += size;
              console.log(`${fileName}: ${(size / 1024 / 1024).toFixed(2)} MB`);
            }
          });
          console.log(`\n💾 Total bundle size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
          console.log('==================\n');
        }
      }
    ]
  }),
}));
