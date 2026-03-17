import axiosClient from './axiosClient';

const executionApiBase = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000/api/users').replace('/api/users', '/api/v1/chats');

export const executeSandboxCode = async ({ code, language = 'javascript' }) => {
  return axiosClient.post(`${executionApiBase}/execute`, {
    code,
    language,
  });
};