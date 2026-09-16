/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  experimental: {
    // Prisma's query engine binary is loaded dynamically and file tracing can
    // miss it; force-include it in the standalone build output.
    outputFileTracingIncludes: {
      "/**": ["./node_modules/.prisma/client/**/*"],
    },
  },
};

module.exports = nextConfig;
