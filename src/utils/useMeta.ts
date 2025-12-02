// src/utils/useMeta.ts
interface MetaOptions {
  title?: string
  description?: string
  keywords?: string
}

export function useMeta({ title, description, keywords }: MetaOptions = {}): void {
  const defaultTitle = import.meta.env.VITE_APP_TITLE || ''
  const defaultDesc = import.meta.env.VITE_APP_DESCRIPTION || ''
  const defaultKeywords = import.meta.env.VITE_APP_KEYWORDS || ''

  document.title = title || defaultTitle

  const setMetaTag = (name: string, content: string): void => {
    let element = document.querySelector(`meta[name="${name}"]`)
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute('name', name)
      document.head.appendChild(element)
    }
    element.setAttribute('content', content)
  }

  setMetaTag('description', description || defaultDesc)
  setMetaTag('keywords', keywords || defaultKeywords)
}

