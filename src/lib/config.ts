export const config = {
  // CRITICAL FIX: Use the correct backend URL from OpenHands-Backend
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'https://maplemoes-openhands-backend.hf.space',
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || 'wss://maplemoes-openhands-backend.hf.space',
  appName: 'OpenHands AI',
  appDescription: 'Powerful AI agent that can execute code, browse the web, and interact with various tools',
  maxMessageLength: 4000,
  maxConversations: 50,
  features: {
    codeExecution: true,
    webBrowsing: true,
    fileManagement: true,
    multipleAgents: true,
    realTimeChat: true,
  }
} as const

export const endpoints = {
  health: '/health',
  config: '/api/options/config',
  conversations: '/api/conversations',
  messages: '/api/messages',
  login: '/api/login',
  analyzeWritingStyle: '/api/analyze-writing-style',
  generateHumanContent: '/api/generate-human-content',
  humanizeText: '/api/humanize-text',
  checkAIDetection: '/api/check-ai-detection',
  chatMessage: '/chat/message',
  simpleConversation: '/api/simple/conversation'
} as const