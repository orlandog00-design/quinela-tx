// assets/js/data-engine.js

/**
 * DataEngine handles fetching and searching of Quiniela results from Google Sheets.
 */
class DataEngine {
    constructor() {
        // The user's published Google Sheet CSV URL
        this.url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMObz19KSMXtEAcdhQzfXb8yPcMLPDjKwZjy0PyC15coaU2JLD--RwVFMoXH1BuMvc_htUoVtHos2a/pub?output=csv";
        this.data = [];
    }

    async fetchData() {
        try {
            console.log("Fetching results from Google Sheets...");
            const response = await fetch(this.url);
            if (!response.ok) throw new Error("Failed to fetch data from Google Sheets.");
            const csvText = await response.text();
            this.data = this.parseCSV(csvText);
            return this.data;
        } catch (error) {
            console.error("Error fetching data:", error);
            return null;
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        return lines.slice(1).map(line => {
            const values = line.split(',');
            const entry = {};
            headers.forEach((header, i) => {
                entry[header] = values[i] ? values[i].trim() : "";
            });
            return entry;
        });
    }

    search(query) {
        if (!query) return this.data;
        const lowerQuery = query.toLowerCase();
        return this.data.filter(item => 
            (item.nombre && item.nombre.toLowerCase().includes(lowerQuery)) ||
            (item.predicciones && item.predicciones.toLowerCase().includes(lowerQuery))
        );
    }
}

// Initialize the data engine with the user's live Google Sheet
const engine = new DataEngine();
