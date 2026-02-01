const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  postFormData(endpoint, formData) {
    // Don't set Content-Type - browser will set it with boundary
    return this.request(endpoint, {
      method: 'POST',
      body: formData,
      headers: {}, // Override default JSON headers
    });
  }

  putFormData(endpoint, formData) {
    return this.request(endpoint, {
      method: 'PUT',
      body: formData,
      headers: {},
    });
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config = {
      credentials: 'include', // IMPORTANT: Send cookies with request
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (!options.headers || Object.keys(options.headers).length > 0) {
        config.headers = {
          'Content-Type': 'application/json',
          ...options.headers,
        };
    }

    // Add CSRF token if it exists (for Django)
    const csrfToken = this.getCsrfToken();
    if (csrfToken && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method)) {
      config.headers['X-CSRFToken'] = csrfToken;
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const data = await response.json().catch(() => null);
      
        // Create a richer error object
        const err = new Error(data?.detail || data?.error || `HTTP ${response.status}`);
        err.status = response.status;
        err.data = data; 
        throw err;
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  getCsrfToken() {
    // Get CSRF token from cookie
    const name = 'csrftoken';
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
    return null;
  }

  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();