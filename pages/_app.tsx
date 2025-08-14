import type { AppProps } from 'next/app';
import '../styles/globals.css';
import '../styles/home-film.css';
import '../styles/mobile.css';
import '../styles/patch.css';
import '../styles/theme.css';
import ErrorBoundary from '@/components/ErrorBoundary';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ErrorBoundary>
      <Component {...pageProps} />
    </ErrorBoundary>
  );
}