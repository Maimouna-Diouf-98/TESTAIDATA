// components/Dashboard.js
import React, { useState, useMemo } from 'react';
import _ from 'lodash';

const Dashboard = ({ data, anomalyReport }) => {
    const [selectedMetric, setSelectedMetric] = useState('revenue');

    const metrics = useMemo(() => {
        if (!data?.length) return null;

        const validRows = data.filter(row => {
            const price = parseFloat(row.price);
            const quantity = parseInt(row.quantity);
            return !isNaN(price) && !isNaN(quantity);
        });

        const totalRevenue = validRows.reduce((sum, row) => sum + parseFloat(row.price) * parseInt(row.quantity), 0);
        const totalOrders = data.length;
        const validOrders = validRows.length;
        const anomalyRate = anomalyReport
            ? (anomalyReport.summary.anomalousRows / anomalyReport.summary.totalRows) * 100
            : 0;
        const uniqueProducts = new Set(data.map(row => row.product_name || row.product || row.name).filter(Boolean)).size;
        const uniqueCustomers = new Set(data.map(row => row.customer_email || row.email).filter(Boolean)).size;
        const averageBasket = validOrders > 0 ? totalRevenue / validOrders : 0;

        const productSales = _.groupBy(validRows, row => row.product_name || row.product || row.name);
        const topProducts = Object.entries(productSales)
            .map(([product, sales]) => ({
                product,
                quantity: sales.reduce((sum, s) => sum + parseInt(s.quantity), 0),
                revenue: sales.reduce((sum, s) => sum + parseFloat(s.price) * parseInt(s.quantity), 0),
                orders: sales.length
            }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 5);

        return {
            totalRevenue,
            totalOrders,
            validOrders,
            anomalyRate,
            uniqueProducts,
            uniqueCustomers,
            averageBasket,
            topProducts,
            dataQuality: anomalyReport?.summary.dataQuality || 'N/A'
        };
    }, [data, anomalyReport]);

    if (!metrics) {
        return (
            <div className="dashboard-loading text-center p-5">
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Calcul des métriques...</span>
                </div>
                <p className="mt-3 text-muted">Analyse des données en cours...</p>
            </div>
        );
    }

    const formatCurrency = (value) =>
        new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
    const formatNumber = (value) => new Intl.NumberFormat('fr-FR').format(value);

    const getAnomalyClass = (rate) =>
        rate < 10 ? 'success' : rate < 20 ? 'warning' : 'danger';

    return (
        <div className="dashboard">
            {/* Indicateurs clés */}
            <div className="row mb-4">
                <div className="col-md-4 mb-3">
                    <div className="card h-100 border-success">
                        <div className="card-body text-center">
                            <div className="display-6 text-success mb-2">
                                <i className="bi bi-currency-euro"></i>
                            </div>
                            <h5 className="card-title text-success">Chiffre d'affaires</h5>
                            <h3 className="text-success">{formatCurrency(metrics.totalRevenue)}</h3>
                            <p className="card-text text-muted small mb-0">
                                Panier moyen: {formatCurrency(metrics.averageBasket)}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className="card h-100 border-primary">
                        <div className="card-body text-center">
                            <div className="display-6 text-primary mb-2">
                                <i className="bi bi-bag-check"></i>
                            </div>
                            <h5 className="card-title text-primary">Commandes</h5>
                            <h3 className="text-primary">{formatNumber(metrics.totalOrders)}</h3>
                            <p className="card-text text-muted small mb-0">
                                Valides: {formatNumber(metrics.validOrders)} ({((metrics.validOrders / metrics.totalOrders) * 100).toFixed(1)}%)
                            </p>
                        </div>
                    </div>
                </div>

                <div className="col-md-4 mb-3">
                    <div className={`card h-100 border-${getAnomalyClass(metrics.anomalyRate)}`}>
                        <div className="card-body text-center">
                            <div className={`display-6 mb-2 text-${getAnomalyClass(metrics.anomalyRate)}`}>
                                <i className="bi bi-shield-exclamation"></i>
                            </div>
                            <h5 className={`card-title text-${getAnomalyClass(metrics.anomalyRate)}`}>
                                Taux d'anomalies
                            </h5>
                            <h3 className={`text-${getAnomalyClass(metrics.anomalyRate)}`}>
                                {metrics.anomalyRate.toFixed(1)}%
                            </h3>
                            <p className="card-text text-muted small mb-0">
                                Qualité: {metrics.dataQuality}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Résumé des anomalies */}
            {anomalyReport && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header d-flex justify-content-between align-items-center">
                                <h5 className="card-title mb-0">
                                    <i className="bi bi-exclamation-triangle text-warning"></i> Résumé des anomalies
                                </h5>
                                <span className={`badge bg-${getAnomalyClass(metrics.anomalyRate)}`}>
                                    {anomalyReport.summary.anomalousRows} lignes affectées
                                </span>
                            </div>
                            <div className="card-body">
                                <div className="row text-center">
                                    <div className="col-md-3">
                                        <div className="h4 text-danger">{anomalyReport.details.price.count}</div>
                                        <div className="text-muted">Prix</div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="h4 text-warning">{anomalyReport.details.quantity.count}</div>
                                        <div className="text-muted">Quantités</div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="h4 text-info">{anomalyReport.details.format.count}</div>
                                        <div className="text-muted">Format</div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="h4 text-secondary">{anomalyReport.details.duplicate.count}</div>
                                        <div className="text-muted">Doublons</div>
                                    </div>
                                </div>

                                {anomalyReport.recommendations?.length > 0 && (
                                    <div className="mt-3">
                                        <h6>Recommandations:</h6>
                                        <ul className="mb-0">
                                            {anomalyReport.recommendations.map((rec, i) => (
                                                <li key={i} className="text-muted">{rec}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Top produits */}
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <h5 className="card-title mb-0">
                                <i className="bi bi-trophy text-warning"></i> Top 5 des produits
                            </h5>
                        </div>
                        <div className="card-body table-responsive">
                            <table className="table table-hover">
                                <thead>
                                    <tr>
                                        <th>Rang</th>
                                        <th>Produit</th>
                                        <th>Chiffre d'affaires</th>
                                        <th>Quantité vendue</th>
                                        <th>Nb commandes</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {metrics.topProducts.map((product, index) => (
                                        <tr key={index}>
                                            <td>
                                                <span className={`badge bg-${index === 0 ? 'warning' : index === 1 ? 'secondary' : 'light text-dark'}`}>
                                                    #{index + 1}
                                                </span>
                                            </td>
                                            <td className="fw-bold">{product.product}</td>
                                            <td className="text-success">{formatCurrency(product.revenue)}</td>
                                            <td>{formatNumber(product.quantity)}</td>
                                            <td>{formatNumber(product.orders)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
