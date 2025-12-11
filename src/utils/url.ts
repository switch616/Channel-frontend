const baseUrl = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '')

export function resolveUrl(path?: string | null): string {
  if (!path) return ''
  if (/^https?:\/\//.test(path)) return path
  return `${baseUrl}/${String(path).replace(/^\/+/, '')}`
}

