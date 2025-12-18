import nextra from 'nextra'

const withNextra = nextra({
  // Nextra 4 options (theme config now in app/layout.tsx)
})

export default withNextra({
  output: 'export',
  images: {
    unoptimized: true,
  },
})
