// components/DataTable.js
import React, { useState, useMemo } from 'react';
import _ from 'lodash';

const DataTable = ({ data, anomalyReport, onExportClean }) => {
    const [sortField, setSortField] = useState('');
    const [sortDirection, setSortDirection] = useState('asc');
    const [filterField, setFilterField] = useState('');
    const [filterValue, setFilterValue] = useState('');
    const [showAnomaliesOnly, setShowAnomaliesOnly] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(25);

    // Créer un map des anomalies par index
    const anomalyMap = useMemo(() => {
        if (!anomalyReport) return new Map();
        
        const allAnomalies = [
            ...anomalyReport.details.price.anomalies,
            ...anomalyReport.details.quantity.anomalies,
            ...anomalyReport.details.format.anomalies,
            ...anomalyReport.details.duplicate.anomalies
        ];

        const map = new Map();
        allAnomalies.forEach(anomaly => {
            if (!map.has(anomaly.index)) {
                map.set(anomaly.index, []);
            }
            map.get(anomaly.index).push(anomaly);
        });
        return map;
    }, [anomalyReport]);

    // Données filtrées et triées
    const filteredAndSortedData = useMemo(() => {
        let filtered = data || [];

        // Filtre par anomalies
        if (showAnomaliesOnly) {
            filtered = filtered.filter((_, index) => anomalyMap.has(index));
        }

        // Filtre par champ
        if (filterField && filterValue) {
            filtered = filtered.filter(row => {
                const value = row[filterField];
                if (!value) return false;
                return String(value).toLowerCase().includes(filterValue.toLowerCase());
            });
        }

        // Tri
        if (sortField) {
            filtered = _.orderBy(filtered, [sortField], [sortDirection]);
        }

        return filtered;
    }, [data, anomalyMap, showAnomaliesOnly, filterField, filterValue, sortField, sortDirection]);

    // Pagination
    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        return filteredAndSortedData.slice(startIndex, endIndex);
    }, [filteredAndSortedData, currentPage, pageSize]);

    const totalPages = Math.ceil(filteredAndSortedData.length / pageSize);

    // Colonnes disponibles
    const columns = useMemo(() => {
        if (!data || data.length === 0) return [];
        return Object.keys(data[0]);
    }, [data]);

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
        setCurrentPage(1);
    };

    const handleFilter = (field, value) => {
        setFilterField(field);
        setFilterValue(value);
        setCurrentPage(1);
    };

    const exportCleanData = () => {
        if (onExportClean && anomalyReport) {
            const cleanData = anomalyReport.cleanData;
            const csv = [
                columns.join(','),
                ...cleanData.map(row => 
                    columns.map(col => `"${(row[col] || '').toString().replace(/"/g, '""')}"`).join(',')
                )
            ].join('\n');
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'donnees_nettoyees.csv';
            link.click();
        }
    };

    const getAnomalyBadges = (index) => {
        const anomalies = anomalyMap.get(index);
        if (!anomalies) return null;

        const typeColors = {
            negative_price: 'danger',
            outlier_price: 'warning',
            invalid_price: 'danger',
            invalid_quantity: 'warning',
            outlier_quantity: 'info',
            invalid_email: 'secondary',
            invalid_date: 'secondary',
            whitespace: 'light',
            duplicate: 'dark'
        };

        return (
            <div className="d-flex flex-wrap gap-1">
                {anomalies.map((anomaly, idx) => (
                    <span
                        key={idx}
                        className={`badge bg-${typeColors[anomaly.type] || 'secondary'} small`}
                        title={anomaly.reason}
                        style={{ fontSize: '0.7rem' }}
                    >
                        {anomaly.type.split('_')[0]}
                    </span>
                ))}
            </div>
        );
    };

    const formatCellValue = (value, field) => {
        if (!value) return '-';
        
        if (field === 'price' && !isNaN(parseFloat(value))) {
            return new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR'
            }).format(parseFloat(value));
        }
        
        if (field === 'quantity' && !isNaN(parseInt(value))) {
            return parseInt(value).toLocaleString('fr-FR');
        }
        
        return String(value);
    };

    return (
        <div className="card">
            <div className="card-header">
                <div className="row align-items-center">
                    <div className="col-md-6">
                        <h5 className="card-title mb-0">
                            <i className="bi bi-table"></i> Données ({filteredAndSortedData.length} lignes)
                        </h5>
                    </div>
                    <div className="col-md-6 text-end">
                        <div className="btn-group" role="group">
                            <button
                                type="button"
                                className={`btn btn-sm ${showAnomaliesOnly ? 'btn-warning' : 'btn-outline-warning'}`}
                                onClick={() => {
                                    setShowAnomaliesOnly(!showAnomaliesOnly);
                                    setCurrentPage(1);
                                }}
                            >
                                <i className="bi bi-exclamation-triangle"></i>
                                {showAnomaliesOnly ? 'Toutes' : 'Anomalies'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-sm btn-outline-success"
                                onClick={exportCleanData}
                                disabled={!anomalyReport}
                                title="Exporter les données nettoyées"
                            >
                                <i className="bi bi-download"></i> Export
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filtres */}
            <div className="card-body border-bottom">
                <div className="row g-3">
                    <div className="col-md-4">
                        <label className="form-label small">Filtrer par champ:</label>
                        <select
                            className="form-select form-select-sm"
                            value={filterField}
                            onChange={(e) => handleFilter(e.target.value, filterValue)}
                        >
                            <option value="">Tous les champs</option>
                            {columns.map(col => (
                                <option key={col} value={col}>{col}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small">Valeur:</label>
                        <input
                            type="text"
                            className="form-control form-control-sm"
                            placeholder="Rechercher..."
                            value={filterValue}
                            onChange={(e) => handleFilter(filterField, e.target.value)}
                        />
                    </div>
                    <div className="col-md-4">
                        <label className="form-label small">Lignes par page:</label>
                        <select
                            className="form-select form-select-sm"
                            value={pageSize}
                            onChange={(e) => {
                                setPageSize(parseInt(e.target.value));
                                setCurrentPage(1);
                            }}
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="table table-hover table-sm mb-0">
                    <thead className="table-light sticky-top">
                        <tr>
                            <th style={{ width: '50px' }}>#</th>
                            {columns.map(col => (
                                <th
                                    key={col}
                                    style={{ cursor: 'pointer', minWidth: '120px' }}
                                    onClick={() => handleSort(col)}
                                >
                                    <div className="d-flex align-items-center justify-content-between">
                                        <span className="text-capitalize">{col}</span>
                                        <i className={`bi bi-arrow-${
                                            sortField === col ? 
                                                (sortDirection === 'asc' ? 'up' : 'down') : 
                                                'up-down'
                                        } text-muted`}></i>
                                    </div>
                                </th>
                            ))}
                            <th style={{ width: '150px' }}>Anomalies</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((row, localIndex) => {
                            const globalIndex = (currentPage - 1) * pageSize + localIndex;
                            const originalIndex = data.indexOf(row);
                            const hasAnomalies = anomalyMap.has(originalIndex);
                            
                            return (
                                <tr
                                    key={originalIndex}
                                    className={hasAnomalies ? 'table-warning' : ''}
                                >
                                    <td className="text-muted small">{originalIndex + 1}</td>
                                    {columns.map(col => (
                                        <td key={col} className="small">
                                            {formatCellValue(row[col], col)}
                                        </td>
                                    ))}
                                    <td>
                                        {getAnomalyBadges(originalIndex)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="card-footer">
                    <div className="row align-items-center">
                        <div className="col-md-6">
                            <small className="text-muted">
                                Affichage {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, filteredAndSortedData.length)} 
                                sur {filteredAndSortedData.length} lignes
                            </small>
                        </div>
                        <div className="col-md-6">
                            <nav>
                                <ul className="pagination pagination-sm justify-content-end mb-0">
                                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(currentPage - 1)}
                                            disabled={currentPage === 1}
                                        >
                                            <i className="bi bi-chevron-left"></i>
                                        </button>
                                    </li>
                                    
                                    {/* Pages */}
                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                                <button
                                                    className="page-link"
                                                    onClick={() => setCurrentPage(pageNum)}
                                                >
                                                    {pageNum}
                                                </button>
                                            </li>
                                        );
                                    })}
                                    
                                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                                        <button
                                            className="page-link"
                                            onClick={() => setCurrentPage(currentPage + 1)}
                                            disabled={currentPage === totalPages}
                                        >
                                            <i className="bi bi-chevron-right"></i>
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DataTable;