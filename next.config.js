const createNextIntlPlugin = require("next-intl/plugin");

const withNextIntl = createNextIntlPlugin();
/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@node-rs/argon2"],
};
module.exports = withNextIntl(nextConfig);
