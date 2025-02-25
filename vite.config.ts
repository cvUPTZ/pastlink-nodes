import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(({ mode }) => {
  const plugins = [react()];

  if (mode === "development") {
    import("lovable-tagger")
      .then((module) => {
        plugins.push(module.componentTagger());
      })
      .catch((err) => {
        console.error("Failed to load lovable-tagger:", err);
      });
  }

  return {
    server: {
      host: "", // or '0.0.0.0'
      allowedHosts: ["rhh5hr-8081.csb.app"], // Use an array
      port: 8080,
      hmr: {
        host: "rhh5hr-8081.csb.app", // No protocol (https://) needed
      },
    },
    plugins: plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
