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
  response: string  // Primary field for AI response from OpenHands-Backend
  message?: string  // Legacy fallback field
  conversation_id: string
  model: string
  timestamp: string
  status: string
  usage?: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
  message_count?: number
  total_tokens?: number
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
    try {
      console.log('🚀 Sending chat message to API:', {
        endpoint: endpoints.chatMessage,
        model: data.model,
        maxTokens: data.max_tokens,
        messageLength: data.message.length
      });
      
      // CRITICAL FIX: Direct API call to OpenRouter for testing
      // This is a temporary fix to bypass the backend and test if OpenRouter works directly
      const OPENROUTER_API_KEY = "sk-or-v1-e9e4b3c5e9c9e9c9e9c9e9c9e9c9e9c9e9c9e9c9e9c9e9c9e9c9e9c9";
      
      // Try direct OpenRouter call first
      try {
        console.log('🔄 ATTEMPTING DIRECT OPENROUTER CALL FOR TESTING');
        
        const openRouterResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: data.model || "anthropic/claude-3.5-sonnet",
            messages: [
              {
                role: "system",
                content: "You are a professional novel writer. Your job is to continue the story with new content."
              },
              {
                role: "user",
                content: data.message
              }
            ],
            max_tokens: data.max_tokens || 800,
            temperature: data.temperature || 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://huggingface.co/spaces/Minatoz997/Backend66',
              'X-Title': 'OpenHands Novel Writer'
            }
          }
        );
        
        console.log('✅ DIRECT OPENROUTER RESPONSE:', openRouterResponse.data);
        
        if (openRouterResponse.data && 
            openRouterResponse.data.choices && 
            openRouterResponse.data.choices.length > 0 &&
            openRouterResponse.data.choices[0].message &&
            openRouterResponse.data.choices[0].message.content) {
          
          const directContent = openRouterResponse.data.choices[0].message.content;
          
          // Return in the format expected by the frontend
          return {
            response: directContent,
            conversation_id: 'direct-openrouter-' + Date.now(),
            model: data.model || "anthropic/claude-3.5-sonnet",
            timestamp: new Date().toISOString(),
            status: 'success',
            usage: openRouterResponse.data.usage
          };
        }
      } catch (openRouterError) {
        console.error('❌ Direct OpenRouter call failed:', openRouterError);
        console.log('⚠️ Falling back to backend API');
      }
      
      // If direct call fails, fall back to the backend API
      const response = await api.post(endpoints.chatMessage, data);
      
      // Log the raw response for debugging
      console.log('📥 Raw API response:', {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: JSON.stringify(response.data, null, 2)
      });
      
      // Handle different response formats
      if (response.data) {
        // If response.data is a string, wrap it
        if (typeof response.data === 'string') {
          console.log('⚠️ API returned string response, wrapping in object');
          return { 
            response: response.data,
            conversation_id: 'unknown',
            model: data.model || 'unknown',
            timestamp: new Date().toISOString(),
            status: 'success'
          };
        }
        
        // Ensure we have a response field
        if (!response.data.response && response.data.message) {
          console.log('⚠️ Moving message field to response field');
          response.data.response = response.data.message;
        }
        
        // If we have choices array (OpenAI format), extract content
        if (!response.data.response && 
            response.data.choices && 
            Array.isArray(response.data.choices) && 
            response.data.choices.length > 0 &&
            response.data.choices[0].message &&
            response.data.choices[0].message.content) {
          
          console.log('⚠️ Extracting content from choices array');
          response.data.response = response.data.choices[0].message.content;
        }
        
        return response.data;
      }
      
      throw new Error('Empty response from API');
    } catch (error) {
      console.error('❌ Error in sendChatMessage:', error);
      // Return a fallback response with dummy text to verify display works
      return {
        response: "Ini adalah teks dummy untuk memverifikasi bahwa auto-pilot dapat menampilkan teks. Jika Anda melihat ini, berarti ada masalah dengan koneksi ke backend atau OpenRouter, tetapi frontend dapat menampilkan teks dengan benar. Silakan periksa log konsol untuk detail lebih lanjut.",
        conversation_id: 'error',
        model: data.model || 'unknown',
        timestamp: new Date().toISOString(),
        status: 'error'
      };
    }
  },

  // Get chat service info
  async getChatInfo(): Promise<ChatServiceInfo> {
    const response = await api.get('/chat/')
    return response.data
  },
}

export default api