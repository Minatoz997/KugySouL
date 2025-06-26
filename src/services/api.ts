'use client';

import axios from 'axios';

// Helper function to extract content from various response formats
export function extractContentFromResponse(response: any): string {
  let content = '';
  
  if (!response) return content;
  
  // Log the response structure for debugging
  console.log('🔍 Response structure:', Object.keys(response));
  
  // Handle different response formats
  if (typeof response === 'object') {
    // Try all possible response formats
    if (response.response && typeof response.response === 'string') {
      content = response.response;
      console.log('✅ Content extracted from response.response');
    } else if (response.message && typeof response.message === 'string') {
      content = response.message;
      console.log('✅ Content extracted from response.message');
    } else if (response.content && typeof response.content === 'string') {
      content = response.content;
      console.log('✅ Content extracted from response.content');
    } else if (response.data && typeof response.data === 'string') {
      content = response.data;
      console.log('✅ Content extracted from response.data');
    } else if (response.result && typeof response.result === 'object') {
      // Handle backend generate-human-content format
      if (response.result.content && typeof response.result.content === 'string') {
        content = response.result.content;
        console.log('✅ Content extracted from response.result.content');
      }
    } else if (response.choices && Array.isArray(response.choices) && response.choices.length > 0) {
      // Handle OpenAI/OpenRouter format
      const choice = response.choices[0];
      if (choice.message && choice.message.content) {
        content = choice.message.content;
        console.log('✅ Content extracted from response.choices[0].message.content');
      } else if (choice.text) {
        content = choice.text;
        console.log('✅ Content extracted from response.choices[0].text');
      }
    }
  } else if (typeof response === 'string') {
    content = response;
    console.log('✅ Response was a string');
  }
  
  return content;
}

// API service functions
export async function sendChatMessage(message: string) {
  try {
    const response = await axios.post('/chat/message', { message });
    return response.data;
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

export async function generateHumanContent(prompt: string, style: any = {}, length: number = 500) {
  try {
    const response = await axios.post('/api/generate-human-content', {
      prompt,
      style_profile: style,
      length
    });
    return response.data;
  } catch (error) {
    console.error('Error generating human content:', error);
    throw error;
  }
}

// Export a default object for compatibility with existing code
const api = {
  sendChatMessage,
  generateHumanContent,
  extractContentFromResponse
};

// Export apiService for backward compatibility with other components
export const apiService = api;

export default api;