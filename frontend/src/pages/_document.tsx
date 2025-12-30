import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Main favicon */}
        <link rel="icon" type="image/png" href="/logo_cashly.png" />
        {/* Apple touch icon */}
        <link rel="apple-touch-icon" href="/logo_cashly.png" />
        {/* Additional favicon for different sizes */}
        <link rel="shortcut icon" href="/logo_cashly.png" />
        <meta name="theme-color" content="#2563eb" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}