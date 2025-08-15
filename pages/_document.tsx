import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Critical SEO Meta Tags */}
        <title>Whatify — AI-Powered Alternate History Timeline Generator</title>
        <meta name="description" content="Rewrite pivotal moments in history and watch an alternate timeline unfold on an interactive world map — narrated by AI." />
        <link rel="canonical" href="https://www.whatify.world/" />
        
        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap"
          as="style"
        />
        
        {/* Meta tags for better SEO and performance */}
        <meta name="theme-color" content="#000000" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        
        {/* Preconnect to external domains */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* Favicons - Complete Setup */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/site.webmanifest" />
        
        {/* Open Graph Meta Tags */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.whatify.world/" />
        <meta property="og:site_name" content="Whatify" />
        <meta property="og:title" content="Whatify — AI-Powered Alternate History Timeline Generator" />
        <meta property="og:description" content="Explore alternate histories with AI: change key events and see the ripple effects on an interactive, narrated world map." />
        <meta property="og:image" content="https://www.whatify.world/og/og-image.jpg" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:locale" content="en_US" />
        
        {/* Twitter Card Meta Tags */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Whatify — AI-Powered Alternate History Timeline Generator" />
        <meta name="twitter:description" content="Rewrite history and visualize alternate timelines on an interactive, narrated world map." />
        <meta name="twitter:image" content="https://www.whatify.world/og/og-image.jpg" />
        
        {/* SEO Keywords - Example "What if?" tags */}
        <meta name="keywords" content="alternate history, AI history generator, what if scenarios, historical simulations, the Roman Empire never fell, Napoleon won at Waterloo, the Cold War turned hot in 1962, the Library of Alexandria never burned, dinosaurs never went extinct, the Black Death never happened, World War II never started, humans colonized Mars in the 1980s, the internet was invented in the 19th century, the American Revolution failed, the Berlin Wall never fell, electricity discovered in ancient Greece, the printing press was never invented, the Mongol Empire conquered all of Europe, the Wright brothers never flew" />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}