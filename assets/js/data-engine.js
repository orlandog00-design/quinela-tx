// assets/js/data-engine.js

/**
 * DataEngine handles fetching and searching of Quiniela results from Google Sheets.
 */
class DataEngine {
    constructor(sheetId) {
        // Convert a regular Google Sheet URL to a CSV export URL
        this.url = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
        this.data = [];
    }

    async fetchData() {
        try {
            console.log("Fetching results from Google Sheets...");
            const response = await fetch(this.url);
            const csvText = await response.text();
            this.data = this.parseCSV(csvText);
            return this.data;
        } catch (error) {
            console.error("Error fetching data:", error);
            return null;
        }
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n');
        const headers = lines[0].split(',');
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const entry = {};
            headers.forEach((header, i) => {
                entry[header.trim().toLowerCase()] = values[i] ? values[i].trim() : "";
            });
            return entry;
        });
    }

    search(query) {
        if (!query) return this.data;
        const lowerQuery = query.toLowerCase();
        return this.data.filter(item => 
            (item.nombre && item.nombre.toLowerCase().includes(lowerQuery)) ||
            (item.celular && item.celular.includes(lowerQuery))
        );
    }
}

// Example usage and initialization
const SHEET_ID = '1Z234567890abcdefghijklmnopqrstuvwxyz'; // PLACEHOLDER
const engine = new DataEngine(SHEET_ID);
