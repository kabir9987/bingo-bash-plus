import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.af1a2be14a7144459c2dbcbf1bf82699',
  appName: 'Bingo Bash',
  webDir: 'dist',
  server: {
    url: 'https://af1a2be1-4a71-4445-9c2d-bcbf1bf82699.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
};

export default config;
