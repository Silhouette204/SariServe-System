// src/sales-service.js

import { API_BASE } from "./config";

export async function fetchSalesDashboardData(timeframe = 'this-week') {
  try {
    const response = await fetch(`${API_BASE}/api/sales/dashboard?timeframe=${timeframe}`, {
      cache: 'no-store',
    });
    if (!response.ok) throw new Error('Failed to fetch sales data');
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}