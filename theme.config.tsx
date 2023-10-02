import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";
import { useRouter } from "next/router";
import { useConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <span>Morgen Developer Documentation</span>,
  project: {
    link: 'https://morgen.so',
  },
  // chat: {
  //   link: 'https://discord.gg/KNaeNhZ9yf',
  // },
  docsRepositoryBase: "https://github.com/morgen-so/morgen-dev-docs",
  footer: {
    text: "Morgen Developer Documentation - Morgen AG © 2020 - 2023 All rights reserved.",
  },
  useNextSeoProps() {
    return {
      titleTemplate: "%s – Morgen Developer Documentation",
    };
  },
  banner: {
    key: "custom-workflow",
    text: (
      <a href="https://platform.morgen.so" target="_blank">
        🎉 Now you can develop your own workflows. Try it out →
      </a>
    ),
  },
  head: () => {
    const { asPath, defaultLocale, locale } = useRouter();
    const { frontMatter } = useConfig();
    const url =
      "https://docs.morgen.so" +
      (defaultLocale === locale ? asPath : `/${locale}${asPath}`);

    return (
      <>
        <meta property="og:url" content={url} />
        <meta property="og:title" content={frontMatter.title || "Morgen API"} />
        <meta
          property="og:description"
          content={frontMatter.description || "Morgen Developer Documentation"}
        />
        <link
          rel="icon"
          type="image/x-icon"
          href="https://uploads-ssl.webflow.com/629614d59c56baedace22d1e/62972f0010f357fdb240353a_favicon.png"
        />
      </>
    );
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === "separator") {
        return <div className="nx-font-medium">{title}</div>;
      }
      return <>{title}</>;
    },
  },
};

export default config;
