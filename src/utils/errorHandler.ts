import axios from 'axios'

export function extractErrorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    return (
      err.response?.data?.msg ||
      err.response?.data?.detail ||
      err.message ||
      '请求失败'
    )
  }
  return '未知错误'
}
