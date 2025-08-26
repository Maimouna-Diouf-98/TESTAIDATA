// components/Charts/TimelineChart.js
import React, { useMemo } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    TimeScale
);

const TimelineChart = ({ data, anomalyReport }) => {
    const chartData = useMemo(() => {
        if (!data || data.length === 0 || !anomalyReport) return null;

        // Créer un map des anomalies par index
        const allAnomalies = [
            ...anomalyReport.details.price.anomalies.map(a => ({ ...a, category: 'Prix' })),
            ...anomalyReport.details.quantity.anomalies.map(a => ({ ...a, category: 'Quantité' })),
            ...anomalyReport.details.format.anomalies.map(a => ({ ...a, category: 'Format' })),
            ...anomalyReport.details.duplicate.anomalies.map(a => ({ ...a, category: 'Doublon' }))
        ];

        const anomalyMap = new Map();
        allAnomalies.forEach(anomaly => {
            if (!anomalyMap.has(anomaly.index)) anomalyMap.set(anomaly.index, []);
            anomalyMap.get(anomaly.index).push(anomaly);
        });

        // Préparer les données pour le scatter plot
        const normalPoints = [];
        const anomalyPoints = [];
        const anomalyDetails = [];

        data.forEach((row, index) => {
            const totalAmount = parseFloat(row.total_amount);

            // Normaliser la date
            let date = null;
            if (row.order_date) {
                const dateStr = row.order_date.trim();
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
            }

            if (date && !isNaN(date.getTime()) && !isNaN(totalAmount)) {
                const point = { x: date, y: totalAmount };

                if (anomalyMap.has(index)) {
                    anomalyPoints.push(point);
                    anomalyDetails.push({
                        ...point,
                        index,
                        anomalies: anomalyMap.get(index),
                        product: row.product_name || 'N/A',
                        email: row.customer_email || 'N/A'
                    });
                } else {
                    normalPoints.push(point);
                }
            }
        });

        return {
            datasets: [
                {
                    label: 'Commandes normales',
                    data: normalPoints,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    pointRadius: 3,
                    pointHoverRadius: 5
                },
                {
                    label: 'Anomalies détectées',
                    data: anomalyPoints,
                    backgroundColor: 'rgba(255, 99, 132, 0.8)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    pointRadius: 5,
                    pointHoverRadius: 7,
                    anomalyDetails
                }
            ]
        };
    }, [data, anomalyReport]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'top' },
            title: { display: true, text: 'Timeline des anomalies', font: { size: 16, weight: 'bold' } },
            tooltip: {
                callbacks: {
                    title: tooltipItems => {
                        const date = new Date(tooltipItems[0].parsed.x);
                        return date.toLocaleDateString('fr-FR');
                    },
                    label: context => {
                        const value = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
                            .format(context.parsed.y);
                        if (context.datasetIndex === 1) { // Anomalies
                            const anomalyDetails = context.dataset.anomalyDetails;
                            if (anomalyDetails && anomalyDetails[context.dataIndex]) {
                                const detail = anomalyDetails[context.dataIndex];
                                let tooltip = [`Valeur: ${value}`];
                                tooltip.push(`Produit: ${detail.product}`);
                                tooltip.push(`Client: ${detail.email}`);
                                tooltip.push('Anomalies:');
                                detail.anomalies.forEach(a => tooltip.push(`• ${a.reason}`));
                                return tooltip;
                            }
                        }
                        return `Valeur: ${value}`;
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'time',
                time: { unit: 'day', displayFormats: { day: 'dd/MM' } },
                title: { display: true, text: 'Date' }
            },
            y: {
                title: { display: true, text: 'Valeur de la commande (€)' },
                ticks: {
                    callback: value => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(value)
                }
            }
        },
        interaction: { intersect: false, mode: 'nearest' }
    };

    if (!chartData) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="text-muted text-center">
                    <i className="bi bi-clock-history fs-1 d-block text-center mb-2"></i>
                    <p>Aucune donnée temporelle disponible</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{ height: '400px' }}>
            <Scatter data={chartData} options={options} />
        </div>
    );
};

export default TimelineChart;
