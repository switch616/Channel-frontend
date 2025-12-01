import CryptoJS from 'crypto-js'

const SECRET_KEY = 'asdasda'  // 自定义密钥

// 加密函数
export function encryptData(data) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), SECRET_KEY).toString()
}

// 解密函数
export function decryptData(encryptedData) {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, SECRET_KEY)
    const decryptedData = bytes.toString(CryptoJS.enc.Utf8)
    
    if (!decryptedData) {
      throw new Error('解密失败，数据可能被篡改或格式不正确')
    }

    return JSON.parse(decryptedData)
  } catch (error) {
    console.error('解密错误:', error.message)
    return null  // 返回 null 或者你想处理的默认值
  }
}



// token 存储 key 名
const TOKEN_KEY = 'adqwedadawda'

// 获取 token：自动判断是否过期
export function getToken() {
  const raw = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY)
  if (!raw) return null

  try {
    const data = JSON.parse(raw)
    if (!data.token || !data.expiresAt) return null

    if (Date.now() > data.expiresAt) {
      // 过期自动清除
      removeToken()
      return null
    }

    return data.token
  } catch {
    removeToken()
    return null
  }
}

// 设置 token（支持记住密码）
export function setToken(token, expiresInSeconds = 3600, remember = false) {
  const expiresAt = Date.now() + expiresInSeconds * 1000
  const payload = JSON.stringify({ token, expiresAt })

  if (remember) {
    localStorage.setItem(TOKEN_KEY, payload)
  } else {
    sessionStorage.setItem(TOKEN_KEY, payload)
  }
}

// 删除 token
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_KEY)
}

export function isTokenExpired(token) {
  const payload = JSON.parse(atob(token.split('.')[1])) // 解码 JWT Token
  const expiryTime = payload.exp * 1000 // Token 的过期时间是一个时间戳
  return Date.now() > expiryTime
}
