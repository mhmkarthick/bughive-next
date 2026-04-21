import axios from "axios"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, // your Railway backend URL
  withCredentials: true, // 🔥 REQUIRED for cookies (refreshToken)
  headers: {
    "Content-Type": "application/json",
  },
})

// Optional: response interceptor (helps debugging)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message)
    return Promise.reject(error)
  }
)

export default api