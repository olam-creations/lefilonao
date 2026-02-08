import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/dashboard/', '/success'],
      },
    ],
    sitemap: 'https://lefilonao.com/sitemap.xml',
  }
}
