import axios from './axios';

export const login = (data) => axios.post('/api/auth/login/', data);
export const signup = (data) => axios.post('/api/auth/signup/', data);
export const logout = () => axios.post('/api/auth/logout/');
export const getUser = () => axios.get('/api/auth/user/');
export const chat = (data) => axios.post('/api/query/', data);
export const getConversations = () => axios.get('/api/conversations/');
export const getConversation = (id) => axios.get(`/api/conversations/${id}/`);
