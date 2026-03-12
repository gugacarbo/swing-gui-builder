import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        background: "var(--background)",
        foreground: "var(--foreground)",
        primary: "var(--primary)",
        "primary-foreground": "var(--primary-foreground)",
        secondary: "var(--secondary)",
        "secondary-foreground": "var(--secondary-foreground)",
        muted: "var(--muted)",
        "muted-foreground": "var(--muted-foreground)",
        accent: "var(--accent)",
        "accent-foreground": "var(--accent-foreground)",
        destructive: "var(--destructive)",
        "destructive-foreground": "var(--destructive-foreground)",
        card: "var(--card)",
        "card-foreground": "var(--card-foreground)",
        popover: "var(--popover)",
        "popover-foreground": "var(--popover-foreground)",
        "vscode-foreground": "var(--vscode-editor-foreground)",
        "vscode-background": "var(--vscode-editor-background)",
        "vscode-panel-background": "var(--vscode-sideBar-background)",
        "vscode-panel-border": "var(--vscode-panel-border)",
        "vscode-input-background": "var(--vscode-input-background)",
        "vscode-input-foreground": "var(--vscode-input-foreground)",
        "vscode-button-background": "var(--vscode-button-background)",
        "vscode-button-foreground": "var(--vscode-button-foreground)",
      },
    },
  },
};

export default config;
