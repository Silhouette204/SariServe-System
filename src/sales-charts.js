import ApexCharts from 'apexcharts';

let mainChart = null;
let modalChart = null;

// Helper para sa base chart configuration
function getChartOptions(categories = [], seriesData = [], height = 300) {
  return {
    series: [{
      name: 'Sales Trend',
      data: seriesData
    }],
    chart: {
      type: 'line',
      height: height,
      fontFamily: 'Poppins, sans-serif',
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: ['#176B87'],
    stroke: { curve: 'smooth', width: 3 },
    markers: {
      size: 5,
      colors: ['#176B87'],
      strokeColors: '#ffffff',
      strokeWidth: 2,
      hover: { size: 7 }
    },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 3 },
    xaxis: {
      categories: categories,
      labels: { style: { colors: '#94a3b8', fontSize: '11px' } },
      axisBorder: { show: false },
      axisTicks: { show: false }
    },
    yaxis: {
      labels: {
        style: { colors: '#94a3b8', fontSize: '11px' },
        formatter: (val) => `₱${val}`
      }
    },
    tooltip: {
      y: { formatter: (val) => `₱${val.toLocaleString()}` }
    }
  };
}

// Function para sa initial render o re-render kapag may bagong DB data
export function renderSalesChart(categories = [], seriesData = []) {
  const chartEl = document.getElementById('sales-trend-chart');
  if (!chartEl) return;

  if (mainChart) {
    mainChart.updateOptions({
      xaxis: { categories: categories },
      series: [{ data: seriesData }]
    });
  } else {
    mainChart = new ApexCharts(chartEl, getChartOptions(categories, seriesData, 300));
    mainChart.render();
  }
}

// Separate renderer para sa Export Modal Chart
export function renderModalSalesChart(categories = [], seriesData = []) {
  const modalChartEl = document.getElementById('report-sales-trend-chart');
  if (!modalChartEl) return;

  if (modalChart) {
    modalChart.destroy(); // Clear existing instance if re-opening
  }

  modalChart = new ApexCharts(modalChartEl, getChartOptions(categories, seriesData, 175));
  modalChart.render();
}