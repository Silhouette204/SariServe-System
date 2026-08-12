// src/sales-service.js

export async function fetchSalesDashboardData(timeframe = 'this-week') {
  try {
    const response = await fetch(`/api/sales/dashboard?timeframe=${timeframe}`);
    if (!response.ok) throw new Error('Failed to fetch sales data');
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    return null;
  }
}