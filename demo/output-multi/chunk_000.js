const API_BASE = 'https://api.example.com';
const headers = {
  'Content-Type': 'application/json'
};
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${ response.status }`);
      }
      return await response.json();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
      }
    }
  }
  throw lastError;
}
const api = {
  async getProducts() {
    return fetchWithRetry(`${ API_BASE }/products`);
  },
  async getProduct(id) {
    return fetchWithRetry(`${ API_BASE }/products/${ id }`);
  },
  async createOrder(orderData) {
    return fetchWithRetry(`${ API_BASE }/orders`, {
      method: 'POST',
      body: JSON.stringify(orderData)
    });
  },
  async updateOrderStatus(orderId, status) {
    return fetchWithRetry(`${ API_BASE }/orders/${ orderId }`, {
      method: 'PATCH',
      body: JSON.stringify({
        status
      })
    });
  },
  async getUser(userId) {
    return fetchWithRetry(`${ API_BASE }/users/${ userId }`);
  },
  async updateUser(userId, userData) {
    return fetchWithRetry(`${ API_BASE }/users/${ userId }`, {
      method: 'PUT',
      body: JSON.stringify(userData)
    });
  }
};
export default api;
