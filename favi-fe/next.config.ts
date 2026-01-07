import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  images: {
    domains: ["i.pravatar.cc", "source.unsplash.com", "i.pravatar.cc", "res.cloudinary.com"], 
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
