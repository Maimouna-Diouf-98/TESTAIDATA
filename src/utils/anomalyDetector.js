// utils/anomalyDetector.js
import _ from 'lodash';

class AnomalyDetector {
    constructor(data) {
        this.data = data;
        this.anomalies = {
            price: [],
            quantity: [],
            format: [],
            duplicate: []
        };
    }

    // Détection des anomalies de prix
    detectPriceAnomalies() {
        const anomalies = [];
        const prices = this.data
            .map(row => row.total_amount ? parseFloat(row.total_amount) : parseFloat(row.price))
            .filter(price => !isNaN(price));
        
        const mean = _.mean(prices);
        const std = Math.sqrt(_.mean(prices.map(p => Math.pow(p - mean, 2))));
        const threshold = 3; // 3 écarts-types
        
        this.data.forEach((row, index) => {
            const price = row.total_amount ? parseFloat(row.total_amount) : parseFloat(row.price);
            
            if (price < 0) {
                anomalies.push({
                    index,
                    type: 'negative_price',
                    value: price,
                    score: 0.9,
                    reason: `Prix négatif détecté: ${price}€`
                });
            } else if (!isNaN(price) && Math.abs(price - mean) > threshold * std) {
                anomalies.push({
                    index,
                    type: 'outlier_price',
                    value: price,
                    score: 0.7,
                    reason: `Prix aberrant: ${price}€ (moyenne: ${mean.toFixed(2)}€)`
                });
            } else if (isNaN(price) || price === 0) {
                anomalies.push({
                    index,
                    type: 'invalid_price',
                    value: row.total_amount || row.price,
                    score: 0.8,
                    reason: `Prix invalide: ${row.total_amount || row.price}`
                });
            }
        });
        
        this.anomalies.price = anomalies;
        return {
            indices: anomalies.map(a => a.index),
            anomalies,
            score: anomalies.length / this.data.length,
            count: anomalies.length
        };
    }

    // Détection des anomalies de quantité
    detectQuantityAnomalies() {
        const anomalies = [];
        const quantities = this.data
            .map(row => parseInt(row.quantity))
            .filter(qty => !isNaN(qty) && qty > 0);
        
        const mean = _.mean(quantities);
        const std = Math.sqrt(_.mean(quantities.map(q => Math.pow(q - mean, 2))));
        const threshold = 3;
        
        this.data.forEach((row, index) => {
            const quantity = parseInt(row.quantity);
            
            if (quantity <= 0 || isNaN(quantity)) {
                anomalies.push({
                    index,
                    type: 'invalid_quantity',
                    value: row.quantity,
                    score: 0.8,
                    reason: `Quantité invalide: ${row.quantity}`
                });
            } else if (Math.abs(quantity - mean) > threshold * std) {
                anomalies.push({
                    index,
                    type: 'outlier_quantity',
                    value: quantity,
                    score: 0.6,
                    reason: `Quantité aberrante: ${quantity} (moyenne: ${mean.toFixed(0)})`
                });
            }
        });
        
        this.anomalies.quantity = anomalies;
        return {
            indices: anomalies.map(a => a.index),
            anomalies,
            score: anomalies.length / this.data.length,
            count: anomalies.length
        };
    }

    // Détection des anomalies de format
    detectFormatAnomalies() {
        const anomalies = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const dateFormats = [
            /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
            /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
            /^\d{2}-\d{2}-\d{4}$/ // DD-MM-YYYY
        ];
        
        this.data.forEach((row, index) => {
            // Validation email
            if (row.customer_email && !emailRegex.test(row.customer_email.trim())) {
                anomalies.push({
                    index,
                    type: 'invalid_email',
                    value: row.customer_email,
                    score: 0.7,
                    reason: `Email malformé: ${row.customer_email}`
                });
            }
            
            // Validation date
            if (row.order_date) {
                const dateStr = row.order_date.trim();
                const isValidFormat = dateFormats.some(format => format.test(dateStr));
                
                if (!isValidFormat) {
                    anomalies.push({
                        index,
                        type: 'invalid_date',
                        value: row.order_date,
                        score: 0.6,
                        reason: `Format de date invalide: ${row.order_date}`
                    });
                }
            }
            
            // Espaces parasites
            Object.keys(row).forEach(key => {
                if (typeof row[key] === 'string' && row[key] !== row[key].trim()) {
                    anomalies.push({
                        index,
                        type: 'whitespace',
                        field: key,
                        value: row[key],
                        score: 0.3,
                        reason: `Espaces parasites dans ${key}`
                    });
                }
            });
        });
        
        this.anomalies.format = anomalies;
        return {
            indices: anomalies.map(a => a.index),
            anomalies,
            score: anomalies.length / this.data.length,
            count: anomalies.length
        };
    }

    // Détection des doublons
    detectDuplicates() {
        const anomalies = [];
        const seen = new Map();
        
        this.data.forEach((row, index) => {
            const key = `${row.customer_email}_${row.product_name}_${row.order_date}_${row.price}`;
            
            if (seen.has(key)) {
                anomalies.push({
                    index,
                    type: 'duplicate',
                    duplicateOf: seen.get(key),
                    score: 0.5,
                    reason: `Doublon détecté (ligne ${seen.get(key) + 1})`
                });
            } else {
                seen.set(key, index);
            }
        });
        
        this.anomalies.duplicate = anomalies;
        return {
            indices: anomalies.map(a => a.index),
            anomalies,
            score: anomalies.length / this.data.length,
            count: anomalies.length
        };
    }

    // Rapport complet
    generateReport() {
        const priceReport = this.detectPriceAnomalies();
        const quantityReport = this.detectQuantityAnomalies();
        const formatReport = this.detectFormatAnomalies();
        const duplicateReport = this.detectDuplicates();
        
        const allAnomalies = [
            ...priceReport.anomalies,
            ...quantityReport.anomalies,
            ...formatReport.anomalies,
            ...duplicateReport.anomalies
        ];
        
        const uniqueAnomalousRows = new Set(allAnomalies.map(a => a.index));
        const globalScore = uniqueAnomalousRows.size / this.data.length;
        
        return {
            summary: {
                totalRows: this.data.length,
                totalAnomalies: allAnomalies.length,
                anomalousRows: uniqueAnomalousRows.size,
                globalScore: globalScore,
                dataQuality: globalScore < 0.1 ? 'Excellent' : 
                           globalScore < 0.2 ? 'Bon' : 
                           globalScore < 0.4 ? 'Moyen' : 'Mauvais'
            },
            details: {
                price: priceReport,
                quantity: quantityReport,
                format: formatReport,
                duplicate: duplicateReport
            },
            recommendations: this.generateRecommendations(allAnomalies),
            cleanData: this.getCleanData(uniqueAnomalousRows)
        };
    }
    
    generateRecommendations(anomalies) {
        const recommendations = [];
        const types = _.countBy(anomalies, 'type');
        
        if (types.negative_price > 0) {
            recommendations.push(`Traiter ${types.negative_price} retours (prix négatifs)`);
        }
        
        if (types.invalid_email > 0) {
            recommendations.push(`Corriger ${types.invalid_email} adresses email`);
        }
        
        if (types.duplicate > 0) {
            recommendations.push(`Supprimer ${types.duplicate} doublons`);
        }
        
        if (types.whitespace > 0) {
            recommendations.push(`Nettoyer les espaces parasites`);
        }
        
        return recommendations;
    }
    
    getCleanData(anomalousIndices) {
        return this.data.filter((_, index) => !anomalousIndices.has(index));
    }
}

export default AnomalyDetector;
