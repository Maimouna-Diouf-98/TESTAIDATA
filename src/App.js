// App.js
import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import FileUpload from './components/FileUpload';
import Dashboard from './components/Dashboard';
import DataTable from './components/DataTable';
import SalesChart from './components/Charts/SalesChart';
import TimelineChart from './components/Charts/TimelineChart';
import AnomalyHeatmap from './components/Charts/AnomalyHeatmap';
import AnomalyDetector from './utils/anomalyDetector';

function App() {
    const [data, setData] = useState(null);
    const [anomalyReport, setAnomalyReport] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboard');

    // Analyse des anomalies
    useEffect(() => {
        if (data?.length > 0) {
            setIsAnalyzing(true);

            setTimeout(() => {
                try {
                    const detector = new AnomalyDetector(data);
                    const report = detector.generateReport();
                    setAnomalyReport(report);
                    console.log('Rapport d\'anomalies généré:', report);
                } catch (err) {
                    console.error('Erreur lors de l\'analyse:', err);
                    setError('Erreur lors de l\'analyse des anomalies');
                } finally {
                    setIsAnalyzing(false);
                }
            }, 500);
        }
    }, [data]);

    const handleDataLoaded = (loadedData) => {
        setData(loadedData);
        setError('');
        setActiveTab('dashboard');
        setAnomalyReport(null);
        console.log('Données chargées:', loadedData.length, 'lignes');
    };

    const handleError = (errorMessage) => {
        setError(errorMessage);
        setData(null);
        setAnomalyReport(null);
    };

    const resetApp = () => {
        setData(null);
        setAnomalyReport(null);
        setError('');
        setActiveTab('dashboard');
    };

    return (
        <div className="App">
            {/* Header */}
            <nav className="navbar navbar-dark bg-primary mb-4">
                <div className="container-fluid">
                    <span className="navbar-brand mb-0 h1">
                        <i className="bi bi-graph-up-arrow me-2"></i>
                        E-commerce Analytics
                    </span>
                    {data && (
                        <button 
                            className="btn btn-outline-light btn-sm"
                            onClick={resetApp}
                        >
                            <i className="bi bi-arrow-clockwise me-1"></i>
                            Nouveau fichier
                        </button>
                    )}
                </div>
            </nav>

            <div className="container-fluid">
                {/* Gestion des erreurs */}
                {error && (
                    <div className="alert alert-danger alert-dismissible fade show" role="alert">
                        <i className="bi bi-exclamation-triangle me-2"></i>
                        {error}
                        <button 
                            type="button" 
                            className="btn-close" 
                            onClick={() => setError('')}
                        ></button>
                    </div>
                )}

                {/* Upload de fichier */}
                {!data && (
                    <div className="row justify-content-center">
                        <div className="col-lg-8">
                            <FileUpload 
                                onDataLoaded={handleDataLoaded}
                                onError={handleError}
                            />
                            <div className="card mt-3">
                                <div className="card-body">
                                    <h6 className="card-title">
                                        <i className="bi bi-info-circle text-info me-2"></i>
                                        Instructions
                                    </h6>
                                    <div className="row">
                                        <div className="col-md-6">
                                            <h6 className="text-primary">Fonctionnalités:</h6>
                                            <ul className="mb-0">
                                                <li>Analyse automatique des anomalies</li>
                                                <li>Dashboard avec indicateurs clés</li>
                                                <li>Visualisations interactives</li>
                                                <li>Table avec tri et filtres</li>
                                                <li>Export des données nettoyées</li>
                                            </ul>
                                        </div>
                                        <div className="col-md-6">
                                            <h6 className="text-primary">Détections:</h6>
                                            <ul className="mb-0">
                                                <li>Prix négatifs et aberrants</li>
                                                <li>Quantités invalides</li>
                                                <li>Formats incorrects (email, date)</li>
                                                <li>Doublons et espaces parasites</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

               
                {data && (
                    <>
                        {isAnalyzing && (
                            <div className="alert alert-info d-flex align-items-center">
                                <div className="spinner-border spinner-border-sm me-3" role="status">
                                    <span className="visually-hidden">Analyse en cours...</span>
                                </div>
                                <div>
                                    <strong>Analyse en cours...</strong>
                                    <br />
                                    <small>Détection des anomalies sur {data.length} lignes</small>
                                </div>
                            </div>
                        )}

                        {/* Navigation par onglets */}
                        <ul className="nav nav-tabs mb-4">
                            {['dashboard', 'charts', 'anomalies', 'data'].map((tab) => (
                                <li className="nav-item" key={tab}>
                                    <button
                                        className={`nav-link ${activeTab === tab ? 'active' : ''}`}
                                        onClick={() => setActiveTab(tab)}
                                    >
                                        {tab === 'dashboard' && <><i className="bi bi-speedometer2 me-1"></i> Dashboard</>}
                                        {tab === 'charts' && <><i className="bi bi-bar-chart me-1"></i> Graphiques</>}
                                        {tab === 'anomalies' && <>
                                            <i className="bi bi-exclamation-triangle me-1"></i> Anomalies
                                            {anomalyReport && (
                                                <span className="badge bg-danger ms-2">
                                                    {anomalyReport.summary.anomalousRows}
                                                </span>
                                            )}
                                        </>}
                                        {tab === 'data' && <><i className="bi bi-table me-1"></i> Données</>}
                                    </button>
                                </li>
                            ))}
                        </ul>

                        {/* Contenu des onglets */}
                        {activeTab === 'dashboard' && <Dashboard data={data} anomalyReport={anomalyReport} />}

                        {activeTab === 'charts' && (
                            <>
                                <div className="row mb-4">
                                    <div className="col-12">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="card-title mb-0">
                                                    <i className="bi bi-graph-up text-primary me-2"></i>
                                                    Évolution des ventes
                                                </h5>
                                            </div>
                                            <div className="card-body">
                                                <SalesChart data={data} type="line" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="row">
                                    <div className="col-lg-8 mb-4">
                                        <div className="card">
                                            <div className="card-header">
                                                <h5 className="card-title mb-0">
                                                    <i className="bi bi-clock-history text-warning me-2"></i>
                                                    Timeline des anomalies
                                                </h5>
                                            </div>
                                            <div className="card-body">
                                                <TimelineChart data={data} anomalyReport={anomalyReport} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="col-lg-4 mb-4">
                                        <div className="card h-100">
                                            <div className="card-header">
                                                <h5 className="card-title mb-0">
                                                    <i className="bi bi-grid text-info me-2"></i>
                                                    Heatmap des anomalies
                                                </h5>
                                            </div>
                                            <div className="card-body">
                                                <AnomalyHeatmap data={data} anomalyReport={anomalyReport} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        {activeTab === 'anomalies' && anomalyReport && (
                            <div className="row">
                                <div className="col-12">
                                    <div className="card border-warning mb-4">
                                        <div className="card-header bg-warning bg-opacity-25">
                                            <h5 className="card-title mb-0">
                                                <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                                                Rapport détaillé des anomalies
                                            </h5>
                                        </div>
                                        <div className="card-body">
                                            <div className="row text-center">
                                                <div className="col-md-3">
                                                    <div className="h2 text-primary">{anomalyReport.summary.totalRows}</div>
                                                    <div className="text-muted">Lignes totales</div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="h2 text-warning">{anomalyReport.summary.anomalousRows}</div>
                                                    <div className="text-muted">Lignes avec anomalies</div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="h2 text-danger">{anomalyReport.summary.totalAnomalies}</div>
                                                    <div className="text-muted">Anomalies totales</div>
                                                </div>
                                                <div className="col-md-3">
                                                    <div className="h2 text-success">{(anomalyReport.summary.globalScore * 100).toFixed(1)}%</div>
                                                    <div className="text-muted">Taux d'anomalies</div>
                                                </div>
                                            </div>

                                            {anomalyReport.recommendations?.length > 0 && (
                                                <div className="mt-4">
                                                    <h6>Recommandations:</h6>
                                                    <ul>
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

                        {activeTab === 'data' && (
                            <DataTable 
                                data={data} 
                                anomalyReport={anomalyReport} 
                                onExportClean={() => alert('Export des données nettoyées (placeholder)')} 
                            />
                        )}
                    </>
                )}
            </div>

        </div>
    );
}

export default App;
