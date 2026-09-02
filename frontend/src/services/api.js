import axios from 'axios';

// Default to port 8000 or relative /api proxy
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

export const apiService = {
  async checkHealth() {
    const res = await client.get('/health');
    return res.data;
  },

  async getReferenceRanges() {
    const res = await client.get('/reference_ranges');
    return res.data;
  },

  async analyzeLabs(labs) {
    const res = await client.post('/analyze_labs', { labs });
    return res.data;
  },

  async analyzeCsv(file) {
    const formData = new FormData();
    formData.append('file', file);
    const res = await client.post('/analyze_csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};
