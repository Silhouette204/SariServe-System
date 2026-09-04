// src/sales-service.js

const API_URL = import.meta.env.VITE_API_URL || '';

export async function fetchSalesDashboardData(timeframe = 'this-week') {
  try {
    const response = await fetch(`${API_URL}/api/sales/dashboard?timeframe=${timeframe}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch sales data');
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}