import { Footer, Layout, Navbar } from 'nextra-theme-docs'
import { Head } from 'nextra/components'
import { getPageMap } from 'nextra/page-map'
import 'nextra-theme-docs/style.css'

export const metadata = {
  title: {
    default: 'Morgen Developer Documentation',
    template: '%s - Morgen Developer Documentation',
  },
  description: 'Morgen Developer Documentation',
}

const navbar = (
  <Navbar
    logo={<span>Morgen Developer Documentation</span>}
    projectLink="https://github.com/morgen-so/morgen-cw-sdk"
  />
)

const footer = (
  <Footer>
    Morgen Developer Documentation - Morgen AG © 2020 - 2023 All rights reserved.
  </Footer>
)

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <Head>
        <link
          rel="icon"
          type="image/x-icon"
          href="https://uploads-ssl.webflow.com/629614d59c56baedace22d1e/62972f0010f357fdb240353a_favicon.png"
        />
      </Head>
      <body>
        <Layout
          navbar={navbar}
          pageMap={await getPageMap()}
          docsRepositoryBase="https://github.com/morgen-so/morgen-dev-docs"
          footer={footer}
        >
          {children}
        </Layout>
      </body>
    </html>
  )
}
