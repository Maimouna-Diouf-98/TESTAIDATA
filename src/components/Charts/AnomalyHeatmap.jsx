// components/Charts/AnomalyHeatmap.js
import React, { useMemo } from 'react';
import _ from 'lodash';

const AnomalyHeatmap = ({ data, anomalyReport }) => {
    const heatmapData = useMemo(() => {
        if (!data || data.length === 0 || !anomalyReport) return null;

        // Créer un map des anomalies par index et par type
        const allAnomalies = [
            ...anomalyReport.details.price.anomalies.map(a => ({ ...a, category: 'Prix' })),
            ...anomalyReport.details.quantity.anomalies.map(a => ({ ...a, category: 'Quantité' })),
            ...anomalyReport.details.format.anomalies.map(a => ({ ...a, category: 'Format' })),
            ...anomalyReport.details.duplicate.anomalies.map(a => ({ ...a, category: 'Doublon' }))
        ];

        // Grouper par date et par type d'anomalie
        const anomaliesByDate = {};
        const anomalyTypes = ['Prix', 'Quantité', 'Format', 'Doublon'];

        allAnomalies.forEach(anomaly => {
            const row = data[anomaly.index];
            if (row && row.order_date) {
                // Normaliser la date
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
                    if (!anomaliesByDate[key]) {
                        anomaliesByDate[key] = { Prix: 0, Quantité: 0, Format: 0, Doublon: 0 };
                    }
                    anomaliesByDate[key][anomaly.category]++;
                }
            }
        });

        // Trier les dates et prendre les 14 derniers jours
        const sortedDates = Object.keys(anomaliesByDate).sort();
        const last14Days = sortedDates.slice(-14);

        return {
            dates: last14Days,
            types: anomalyTypes,
            data: anomaliesByDate
        };
    }, [data, anomalyReport]);

    if (!heatmapData || heatmapData.dates.length === 0) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '300px' }}>
                <div className="text-muted text-center">
                    <i className="bi bi-grid fs-1 d-block text-center mb-2"></i>
                    <p>Aucune anomalie à afficher</p>
                </div>
            </div>
        );
    }

    // Calculer l'intensité maximale pour la normalisation
    const maxIntensity = Math.max(
        ...heatmapData.dates.map(date => 
            Math.max(...heatmapData.types.map(type => 
                heatmapData.data[date] ? heatmapData.data[date][type] : 0
            ))
        )
    );

    const getIntensityColor = (value) => {
        if (value === 0) return 'bg-light';
        const intensity = value / maxIntensity;
        if (intensity <= 0.2) return 'bg-info bg-opacity-25';
        if (intensity <= 0.4) return 'bg-warning bg-opacity-50';
        if (intensity <= 0.7) return 'bg-warning bg-opacity-75';
        return 'bg-danger bg-opacity-75';
    };

    const getTextColor = (value) => {
        if (value === 0) return 'text-muted';
        const intensity = value / maxIntensity;
        return intensity > 0.5 ? 'text-white' : 'text-dark';
    };

    return (
        <div className="heatmap-container">
            <div className="mb-3 d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Heatmap des anomalies (14 derniers jours)</h6>
                <div className="d-flex align-items-center">
                    <small className="text-muted me-2">Faible</small>
                    <div className="heatmap-legend d-flex">
                        <div className="legend-cell bg-light border"></div>
                        <div className="legend-cell bg-info bg-opacity-25 border"></div>
                        <div className="legend-cell bg-warning bg-opacity-50 border"></div>
                        <div className="legend-cell bg-warning bg-opacity-75 border"></div>
                        <div className="legend-cell bg-danger bg-opacity-75 border"></div>
                    </div>
                    <small className="text-muted ms-2">Élevé</small>
                </div>
            </div>

            <div className="table-responsive">
                <table className="table table-bordered table-sm heatmap-table">
                    <thead>
                        <tr>
                            <th className="bg-light text-center align-middle" style={{ width: '100px' }}>
                                Type / Date
                            </th>
                            {heatmapData.dates.map(date => {
                                const d = new Date(date);
                                return (
                                    <th key={date} className="bg-light text-center" style={{ minWidth: '60px' }}>
                                        <div className="small">{d.getDate()}</div>
                                        <div className="x-small text-muted">
                                            {d.toLocaleDateString('fr-FR', { month: 'short' })}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {heatmapData.types.map(type => (
                            <tr key={type}>
                                <td className="bg-light fw-bold text-center align-middle">
                                    <div className="d-flex align-items-center justify-content-center">
                                        <i className={`bi bi-${
                                            type === 'Prix' ? 'currency-euro' :
                                            type === 'Quantité' ? 'hash' :
                                            type === 'Format' ? 'file-text' :
                                            'files'
                                        } me-1`}></i>
                                        <small>{type}</small>
                                    </div>
                                </td>
                                {heatmapData.dates.map(date => {
                                    const value = heatmapData.data[date] ? heatmapData.data[date][type] : 0;
                                    return (
                                        <td
                                            key={`${type}-${date}`}
                                            className={`text-center align-middle ${getIntensityColor(value)} ${getTextColor(value)}`}
                                            style={{ height: '45px', position: 'relative' }}
                                            title={`${type}: ${value} anomalie(s) le ${new Date(date).toLocaleDateString('fr-FR')}`}
                                        >
                                            <div className="fw-bold">{value > 0 ? value : ''}</div>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-2 text-muted small">
                <i className="bi bi-info-circle me-1"></i>
                Survolez les cellules pour plus de détails
            </div>

            <style jsx>{`
                .heatmap-table th,
                .heatmap-table td {
                    padding: 0.25rem;
                    border: 1px solid #dee2e6;
                }
                
                .legend-cell {
                    width: 15px;
                    height: 15px;
                    margin: 0 1px;
                }
                
                .x-small {
                    font-size: 0.7rem;
                }
                
                .heatmap-table td:hover {
                    box-shadow: inset 0 0 0 2px #007bff;
                    cursor: pointer;
                }
            `}</style>
        </div>
    );
};

export default AnomalyHeatmap;
