# E-commerce Analytics - Détection d'anomalies

## Description
E-commerce Analytics est une application web interactive développée avec **React.js** et **Bootstrap** pour analyser des données e-commerce et détecter automatiquement les anomalies.  
Elle permet de visualiser des indicateurs clés, des graphiques, un tableau des données et un rapport détaillé des anomalies.

L'application fonctionne entièrement **côté client**, avec une interface responsive et intuitive.

---

## Fonctionnalités principales
- **Upload de fichier CSV** contenant les données e-commerce.
- **Analyse automatique des anomalies** :
  - Prix négatifs ou aberrants
  - Quantités invalides
  - Formats incorrects (email, date)
  - Doublons et espaces parasites
- **Dashboard des indicateurs clés** :
  - Chiffre d'affaires total et panier moyen
  - Nombre de commandes (totales et valides)
  - Taux d'anomalies et qualité des données
  - Produits et clients uniques
  - Top 5 des produits
- **Graphiques interactifs** :
  - Évolution des ventes
  - Timeline des anomalies
  - Heatmap des anomalies
- **Table des données** avec tri, filtres et possibilité d’exporter les données nettoyées.
- Gestion des erreurs et affichage de messages clairs pour l'utilisateur.
- Interface moderne avec **Bootstrap** et **Bootstrap Icons**.

---

## Technologies utilisées
- **Frontend** : React.js, Bootstrap, Bootstrap Icons
- **Visualisations** : Chart.js (pour SalesChart, TimelineChart, AnomalyHeatmap)
- **Utilitaires** : Lodash, utilitaires personnalisés pour la détection d’anomalies

---

## Structure du projet
/src
/components
FileUpload.js
Dashboard.js
DataTable.js
/Charts
SalesChart.js
TimelineChart.js
AnomalyHeatmap.js
/utils
anomalyDetector.js
/style
Dashboard.css
App.js
index.js

- **App.js** : Composant principal, gestion de l'état et navigation par onglets.
- **Dashboard.js** : Affiche les indicateurs clés et le top produits.
- **FileUpload.js** : Gestion de l’upload de fichiers CSV.
- **DataTable.js** : Affiche les données en tableau avec filtres et export.
- **Charts/** : Contient tous les graphiques (ligne, timeline, heatmap).
- **anomalyDetector.js** : Algorithme de détection des anomalies.

---

## Installation et lancement

1. Cloner le projet :
```bash
git clone <URL_DU_REPO>

## Installer les dépendances :

npm install


Lancer l'application :

npm start


Ouvrir http://localhost:3000
dans le navigateur.

## Utilisation

Cliquer sur "Choisir un fichier" pour uploader un CSV.

L'application analysera automatiquement les anomalies.

Naviguer entre les onglets :

Dashboard : Indicateurs clés

Graphiques : Visualisations des ventes et anomalies

Anomalies : Rapport détaillé des anomalies

Données : Tableau interactif et export

Cliquer sur "Nouveau fichier" pour réinitialiser l'application et analyser un nouveau CSV.

Exemples d’interface

Dashboard : Affiche le chiffre d'affaires, le panier moyen, les commandes valides, le taux d'anomalies, et le top 5 des produits.

Graphiques : Évolution des ventes, Timeline des anomalies, Heatmap.

Anomalies : Détails par type d’anomalie (prix, quantité, doublons, format).

DataTable : Vue complète des données avec possibilité d’export.

Notes techniques

Les calculs sont effectués côté client pour des performances optimales sur des fichiers jusqu’à 2500 lignes ou plus.

L'analyse inclut un taux global d'anomalies ainsi que des recommandations.

Le code utilise React hooks (useState, useEffect, useMemo) pour gérer l'état et les calculs.

