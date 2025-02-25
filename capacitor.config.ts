
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.60dd24b8768c40c6a50d5c4c1db9cb03',
  appName: 'Inntro Social',
  webDir: 'dist',
  server: {
    url: 'https://60dd24b8-768c-40c6-a50d-5c4c1db9cb03.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  ios: {
    contentInset: 'always'
  }
};

export default config;
