import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.86325668238548118168d7a61a313f45',
  appName: 'cosmic-expense-manager-ui',
  webDir: 'dist',
  server: {
    url: "https://86325668-2385-4811-8168-d7a61a313f45.lovableproject.com?forceHideBadge=true",
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3000,
      backgroundColor: "#000000",
      showSpinner: true,
      spinnerColor: "#22c55e"
    }
  }
};

export default config;