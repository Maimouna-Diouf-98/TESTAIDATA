// components/FileUpload.js
import React, { useState, useRef } from 'react';
import Papa from 'papaparse';

const FileUpload = ({ onDataLoaded, onError }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    const handleFiles = (files) => {
        if (files.length === 0) return;
        const file = files[0];

        if (!file.name.toLowerCase().endsWith('.csv')) {
            onError('Veuillez sélectionner un fichier CSV');
            return;
        }

        setIsLoading(true);

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            delimitersToGuess: [',', ';', '\t'],
            complete: (results) => {
                setIsLoading(false);

                if (results.errors.length > 0) {
                    console.warn('Avertissements de parsing:', results.errors);
                }

                const cleanedData = results.data.map(row => {
                    const cleanRow = {};
                    Object.keys(row).forEach(key => {
                        const cleanKey = key.trim().toLowerCase();
                        cleanRow[cleanKey] = typeof row[key] === 'string' ? row[key] : String(row[key] || '');
                    });
                    return cleanRow;
                });

                if (cleanedData.length === 0) {
                    onError('Le fichier CSV est vide');
                    return;
                }

                onDataLoaded(cleanedData);
            },
            error: (error) => {
                setIsLoading(false);
                onError(`Erreur lors de la lecture du fichier: ${error.message}`);
            }
        });
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFileSelect = (e) => {
        if (e.target.files) {
            handleFiles(e.target.files);
        }
    };

    const openFileDialog = () => {
        fileInputRef.current?.click();
    };

    return (
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "100vh" }}>
            <div className="card shadow-lg border-0 rounded-4" style={{ width: "100%" }}>
                <div className="card-header bg-primary text-white text-center rounded-top-4">
                    <h4 className="mb-0 fw-bold">
                        <i className="bi bi-cloud-upload me-2"></i> Importer un fichier CSV
                    </h4>
                </div>
                <div className="card-body p-4">
                    <div
                        className={`upload-zone border-2 border-dashed rounded-3 p-4 text-center ${dragActive ? 'border-primary bg-light' : 'border-secondary'} ${isLoading ? 'disabled' : ''}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={!isLoading ? openFileDialog : undefined}
                        style={{
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            minHeight: '200px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'center'
                        }}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            disabled={isLoading}
                        />

                        {isLoading ? (
                            <>
                                <div className="spinner-border text-primary mb-3" role="status">
                                    <span className="visually-hidden">Chargement...</span>
                                </div>
                                <p className="text-muted fw-semibold">Traitement du fichier en cours...</p>
                            </>
                        ) : (
                            <>
                                <div className="mb-3 text-primary">
                                    <i className="bi bi-file-earmark-spreadsheet" style={{ fontSize: "48px" }}></i>
                                </div>
                                <h5 className="fw-bold mb-2">
                                    {dragActive ? 'Déposez votre fichier ici' : 'Glissez-déposez votre fichier CSV'}
                                </h5>
                                <p className="text-muted lead">
                                    ou <span className="text-primary fw-bold">cliquez pour sélectionner</span>
                                </p>
                                <div className="text-muted small">
                                    <div> Formats acceptés : <span className="fw-semibold">.csv</span></div>
                                    <div>Taille max : <span className="fw-semibold">10MB</span></div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="mt-4 text-muted small text-center">
                        <strong>Format attendu :</strong><br />
                        <span className="fst-italic">CSV avec headers (email, product, price, quantity, date...)</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FileUpload;
