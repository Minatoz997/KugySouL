import axios from 'axios'
import { config, endpoints } from '@/lib/config'
import type { 
  ApiConfig, 
  CreateConversationRequest, 
  CreateConversationResponse,
  LoginRequest,
  LoginResponse,
  AnalyzeWritingStyleRequest,
  AnalyzeWritingStyleResponse,
  GenerateHumanContentRequest,
  GenerateHumanContentResponse,
  HumanizeTextRequest,
  HumanizeTextResponse,
  CheckAIDetectionRequest,
  CheckAIDetectionResponse
} from '@/types'

// Additional interfaces for chat functionality
interface ChatResponse {
  response: string  // Backend returns "response", not "message"
  message?: string  // Fallback for compatibility
  content?: string  // Additional field for content
  data?: string     // Additional field for data
  conversation_id?: string
  model?: string
  timestamp?: string
  status?: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

interface ChatServiceInfo {
  name: string
  version: string
  description: string
  status: string
  endpoints: Record<string, string>
}

const api = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  // Security configurations
  withCredentials: false, // Don't send cookies for security
  maxRedirects: 5,
  validateStatus: (status) => status < 500, // Accept 4xx as valid responses
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    }
    
    // Add security headers
    if (config.headers) {
      config.headers['X-Requested-With'] = 'XMLHttpRequest'
    }
    
    return config
  },
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Request Error:', error)
    }
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ API Response: ${response.status} ${response.config.url}`)
    }
    return response
  },
  (error) => {
    // Only log detailed errors in development
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ API Response Error:', error.response?.status, error.response?.data)
    }
    
    // Sanitize error for production
    const sanitizedError = {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
    }
    
    return Promise.reject(sanitizedError)
  }
)

export const apiService = {
  // Health check
  async checkHealth(): Promise<string> {
    const response = await api.get(endpoints.health)
    return response.data
  },

  // Get configuration
  async getConfig(): Promise<ApiConfig> {
    const response = await api.get(endpoints.config)
    return response.data
  },

  // Create conversation
  async createConversation(data: CreateConversationRequest): Promise<CreateConversationResponse> {
    const response = await api.post(endpoints.conversations, data)
    return response.data
  },

  // User login
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await api.post(endpoints.login, data)
    return response.data
  },

  // Analyze writing style
  async analyzeWritingStyle(data: AnalyzeWritingStyleRequest): Promise<AnalyzeWritingStyleResponse> {
    const response = await api.post(endpoints.analyzeWritingStyle, data)
    return response.data
  },

  // Generate human-like content
  async generateHumanContent(data: GenerateHumanContentRequest): Promise<GenerateHumanContentResponse> {
    const response = await api.post(endpoints.generateHumanContent, data)
    
    // Log response structure for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Generate human content response structure:', Object.keys(response.data))
    }
    
    // Handle different response formats from backend
    if (response.data) {
      // Standard format: { status, result: { content, ... }, message }
      if (response.data.result && response.data.result.content) {
        return {
          content: response.data.result.content,
          style_match_score: response.data.result.style_match_score || 0,
          human_likelihood: response.data.result.human_likelihood || 0,
          content_stats: {
            word_count: response.data.result.word_count || 0,
            readability_score: response.data.result.quality_indicators?.readability || 0,
            descriptive_elements: response.data.result.generation_metadata?.uniqueness_score || 0
          }
        }
      }
      
      // Chat API format: { status, response, model, timestamp, usage }
      if (response.data.response && typeof response.data.response === 'string') {
        return {
          content: response.data.response,
          style_match_score: 0.8, // Default values
          human_likelihood: 0.9,
          content_stats: {
            word_count: response.data.response.split(/\s+/).length,
            readability_score: 0.75,
            descriptive_elements: 0.8
          }
        }
      }
      
      // Direct content format: { content, ... }
      if (response.data.content && typeof response.data.content === 'string') {
        return {
          content: response.data.content,
          style_match_score: 0.8,
          human_likelihood: 0.9,
          content_stats: {
            word_count: response.data.content.split(/\s+/).length,
            readability_score: 0.75,
            descriptive_elements: 0.8
          }
        }
      }
      
      // Message format: { message, ... }
      if (response.data.message && typeof response.data.message === 'string' && response.data.message.length > 50) {
        return {
          content: response.data.message,
          style_match_score: 0.8,
          human_likelihood: 0.9,
          content_stats: {
            word_count: response.data.message.split(/\s+/).length,
            readability_score: 0.75,
            descriptive_elements: 0.8
          }
        }
      }
    }
    
    // Fallback to original response
    return response.data
  },

  // Humanize AI-generated text
  async humanizeText(data: HumanizeTextRequest): Promise<HumanizeTextResponse> {
    const response = await api.post(endpoints.humanizeText, data)
    return response.data
  },

  // Check AI detection risk
  async checkAIDetection(data: CheckAIDetectionRequest): Promise<CheckAIDetectionResponse> {
    const response = await api.post(endpoints.checkAIDetection, data)
    return response.data
  },

  // Get conversations
  async getConversations(): Promise<unknown> {
    const response = await api.get(endpoints.conversations)
    return response.data
  },

  // Simple conversation
  async simpleConversation(data: Record<string, unknown>): Promise<unknown> {
    const response = await api.post(endpoints.simpleConversation, data)
    return response.data
  },

  // Generic GET request
  async get<T>(url: string): Promise<T> {
    const response = await api.get(url)
    return response.data
  },

  // Generic POST request
  async post<T>(url: string, data?: unknown): Promise<T> {
    const response = await api.post(url, data)
    return response.data
  },

  // Generic PUT request
  async put<T>(url: string, data?: unknown): Promise<T> {
    const response = await api.put(url, data)
    return response.data
  },

  // Generic DELETE request
  async delete<T>(url: string): Promise<T> {
    const response = await api.delete(url)
    return response.data
  },

  // Chat with OpenRouter API
  async sendChatMessage(data: {
    message: string
    conversation_id?: string
    model?: string
    api_key?: string
    stream?: boolean
    max_tokens?: number
    temperature?: number
  }): Promise<ChatResponse> {
    const response = await api.post(endpoints.chatMessage, data)
    
    // Handle different response formats from backend
    if (response.data) {
      // Log response structure for debugging
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Chat response structure:', Object.keys(response.data))
      }
      
      // If response has result.content format (from generate-human-content endpoint)
      if (response.data.result && response.data.result.content) {
        return {
          response: response.data.result.content,
          status: response.data.status || 'success',
          model: data.model
        }
      }
      
      // If response has choices format (from OpenAI/OpenRouter direct API)
      if (response.data.choices && Array.isArray(response.data.choices) && response.data.choices.length > 0) {
        const choice = response.data.choices[0]
        if (choice.message && choice.message.content) {
          return {
            response: choice.message.content,
            status: 'success',
            model: response.data.model || data.model
          }
        } else if (choice.text) {
          return {
            response: choice.text,
            status: 'success',
            model: response.data.model || data.model
          }
        }
      }
      
      // If response has content field
      if (response.data.content && typeof response.data.content === 'string') {
        return {
          response: response.data.content,
          status: response.data.status || 'success',
          model: data.model
        }
      }
      
      // If response has data field
      if (response.data.data && typeof response.data.data === 'string') {
        return {
          response: response.data.data,
          status: response.data.status || 'success',
          model: data.model
        }
      }
      
      // If response has message field
      if (response.data.message && typeof response.data.message === 'string' && response.data.message.length > 50) {
        return {
          response: response.data.message,
          message: response.data.message,
          status: response.data.status || 'success',
          model: data.model
        }
      }
      
      // Try to find any string field that might contain the response
      for (const key in response.data) {
        if (typeof response.data[key] === 'string' && response.data[key].length > 50) {
          return {
            response: response.data[key],
            status: response.data.status || 'success',
            model: data.model
          }
        }
      }
    }
    
    return response.data
  },

  // Get chat service info
  async getChatInfo(): Promise<ChatServiceInfo> {
    const response = await api.get('/chat/')
    return response.data
  },
}

export default api