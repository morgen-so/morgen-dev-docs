import React from 'react'
import { DocsThemeConfig } from 'nextra-theme-docs'

const config: DocsThemeConfig = {
  logo: <span>Morgen APIs</span>,
  project: {
    link: 'https://morgen.so',
  },
  // chat: {
  //   link: 'https://discord.gg/KNaeNhZ9yf',
  // },
  docsRepositoryBase: 'https://github.com/morgen-so/morgen-dev-docs',
  footer: {
    text: 'Morgen Docs - Morgen AG © 2020 - 2023 All rights reserved.',
  },
  sidebar: {
    titleComponent({ title, type }) {
      if (type === 'separator') {
        return (
          <div className="nx-font-medium">{title}</div>
        )
      }
      return <>{title}</>
    }
  }
}

export default config
