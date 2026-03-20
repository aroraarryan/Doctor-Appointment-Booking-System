import axios from 'axios'

const api = axios.create({
       baseURL: 'http://localhost:5002/api',
})

api.interceptors.request.use((config) => {
       const token = localStorage.getItem('token');
       const sessionToken = localStorage.getItem('sessionToken');
       
       if (token) {
              config.headers.Authorization = `Bearer ${token}`;
       }
       if (sessionToken) {
              config.headers['x-session-token'] = sessionToken;
       }
       return config;
});

export default api
