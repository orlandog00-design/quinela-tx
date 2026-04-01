// assets/js/data-engine.js

/**
 * DataEngine handles fetching and searching of Quiniela results from Google Sheets.
 */
class DataEngine {
    constructor() {
        // The user's published Google Sheet CSV URL
        this.url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMObz19KSMXtEAcdhQzfXb8yPcMLPDjKwZjy0PyC15coaU2JLD--RwVFMoXH1BuMvc_htUoVtHos2a/pub?output=csv";
        
        // Official Liga MX Team Logos (High-quality CDN links)
        this.TEAM_LOGOS = {
            "América": "https://img.vavel.com/club-america-logo-1.png",
            "Chivas": "https://img.vavel.com/chivas-guadalajara-logo.png",
            "Cruz Azul": "https://img.vavel.com/cruz-azul-logo.png",
            "Pumas": "https://img.vavel.com/pumas-unam-logo.png",
            "Tigres": "https://img.vavel.com/tigres-uanl-logo.png",
            "Monterrey": "https://img.vavel.com/monterrey-rayados-logo.png",
            "Toluca": "https://img.vavel.com/toluca-fc-logo.png",
            "Pachuca": "https://img.vavel.com/pachuca-cf-logo.png",
            "León": "https://img.vavel.com/club-leon-logo.png",
            "Santos": "https://img.vavel.com/santos-laguna-logo.png",
            "Atlas": "https://img.vavel.com/atlas-fc-logo.png",
            "Necaxa": "https://img.vavel.com/club-necaxa-logo.png",
            "Juárez": "https://img.vavel.com/fc-juarez-logo.png",
            "Mazatlán": "https://img.vavel.com/mazatlan-fc-logo.png",
            "Tijuana": "https://img.vavel.com/club-tijuana-xolos-logo.png",
            "Puebla": "https://img.vavel.com/puebla-fc-logo.png",
            "Querétaro": "https://img.vavel.com/queretaro-fc-logo.png",
            "San Luis": "https://img.vavel.com/atletico-san-luis-logo.png"
        };

        this.data = [];
        this.matches = [];
    }

    async fetchMatches() {
        // We will use the same sheet but maybe a different tab if the user sets it up
        // For now, let's keep the matchesUrl ready for the next update
        return this.matches;
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
