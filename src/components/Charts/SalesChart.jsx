// components/Charts/SalesChart.js
import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import _ from 'lodash';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend
);

const SalesChart = ({ data, type = 'bar' }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0) return null;

        // Filtrer les données valides
        const validData = data.filter(row => 
            row.order_date && (row.total_amount || row.price) && row.quantity &&
            (!isNaN(parseFloat(row.total_amount)) || !isNaN(parseFloat(row.price))) &&
            !isNaN(parseInt(row.quantity))
        );

        // Normaliser les dates et grouper par jour
        const salesByDate = {};
        validData.forEach(row => {
            // Prendre total_amount si dispo, sinon price * quantity
            const amount = row.total_amount 
                ? parseFloat(row.total_amount) 
                : parseFloat(row.price) * parseInt(row.quantity);

            const quantity = parseInt(row.quantity);

            // Normaliser le format de date
            let dateStr = row.order_date.trim();
            let date;
            
            if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
                date = new Date(dateStr);
            } else if (dateStr.match(/^\d{2}\/\d{2}\/\d{4}$/)) {
                const [day, month, year] = dateStr.split('/');
                date = new Date(year, month - 1, day);
            } else if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
                const [day, month, year] = dateStr.split('-');
                date = new Date(year, month - 1, day);
            } else {
                date = new Date(dateStr);
            }
            
            if (!isNaN(date.getTime())) {
                const key = date.toISOString().split('T')[0]; 
                if (!salesByDate[key]) {
                    salesByDate[key] = { revenue: 0, orders: 0, quantity: 0 };
                }
                salesByDate[key].revenue += amount;
                salesByDate[key].orders += 1;
                salesByDate[key].quantity += quantity;
            }
        });

        // Trier par date et prendre les 30 derniers jours
        const sortedDates = Object.keys(salesByDate).sort();
        const last30Days = sortedDates.slice(-30);

        const labels = last30Days.map(date => {
            const d = new Date(date);
            return d.toLocaleDateString('fr-FR', { month: 'short', day: 'numeric' });
        });

        const revenues = last30Days.map(date => salesByDate[date].revenue);
        const orders = last30Days.map(date => salesByDate[date].orders);

        return {
            labels,
            datasets: type === 'bar' ? [
                {
                    label: 'Chiffre d\'affaires (€)',
                    data: revenues,
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1,
                    yAxisID: 'y'
                },
                {
                    label: 'Nombre de commandes',
                    data: orders,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1,
                    yAxisID: 'y1'
                }
            ] : [
                {
                    label: 'Chiffre d\'affaires (€)',
                    data: revenues,
                    borderColor: 'rgba(54, 162, 235, 1)',
                    backgroundColor: 'rgba(54, 162, 235, 0.2)',
                    tension: 0.4,
                    yAxisID: 'y'
                },
                {
                    label: 'Nombre de commandes',
                    data: orders,
                    borderColor: 'rgba(255, 99, 132, 1)',
                    backgroundColor: 'rgba(255, 99, 132, 0.2)',
                    tension: 0.4,
                    yAxisID: 'y1'
                }
            ]
        };
    }, [data, type]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Évolution des ventes (30 derniers jours)',
                font: {
                    size: 16,
                    weight: 'bold'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.datasetIndex === 0) {
                            label += new Intl.NumberFormat('fr-FR', {
                                style: 'currency',
                                currency: 'EUR'
                            }).format(context.parsed.y);
                        } else {
                            label += new Intl.NumberFormat('fr-FR').format(context.parsed.y);
                        }
                        return label;
                    }
                }
            }
        },
        scales: {
            x: {
                display: true,
                title: {
                    display: true,
                    text: 'Date'
                }
            },
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                title: {
                    display: true,
                    text: 'Chiffre d\'affaires (€)'
                },
                ticks: {
                    callback: function(value) {
                        return new Intl.NumberFormat('fr-FR', {
                            style: 'currency',
                            currency: 'EUR',
                            minimumFractionDigits: 0
                        }).format(value);
                    }
                }
            },
            y1: {
                type: 'linear',
                display: true,
                position: 'right',
                title: {
                    display: true,
                    text: 'Nombre de commandes'
                },
                grid: {
                    drawOnChartArea: false,
                },
            },
        },
        interaction: {
            mode: 'nearest',
            axis: 'x',
            intersect: false
        }
    };

    if (!chartData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="text-muted">
                    <i className="bi bi-graph-up fs-1 d-block text-center mb-2"></i>
                    <p>Aucune donnée de vente disponible</p>
                </div>
            </div>
        );
    }

    const ChartComponent = type === 'bar' ? Bar : Line;

    return (
        <div style={{ height: '400px' }}>
            <ChartComponent data={chartData} options={options} />
        </div>
    );
};

export default SalesChart;
