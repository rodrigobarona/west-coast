/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  i18n: {
    locales: ["pt", "es", "en"],
    defaultLocale: "pt",
  },
  env: {
    NEXT_EXAMPLE_CMS_DATOCMS_API_TOKEN:
      process.env.NEXT_EXAMPLE_CMS_DATOCMS_API_TOKEN,
  },
  images: {
    loader: "custom",
    path: "./loader.js",
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.datocms-assets.com",
        port: "",
        pathname: "/104915/**",
      },
    ],
  },

  async redirects() {
    return [
      {
        source: "/posts/ride",
        destination: "/posts/enjoying-the-ride",
        permanent: true,
      },
      {
        source: "/es/posts/ride",
        destination: "/es/posts/enjoying-the-ride",
        permanent: true,
      },
      {
        source: "/en/posts/ride",
        destination: "/en/posts/enjoying-the-ride",
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
