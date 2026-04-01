// assets/js/data-engine.js

/**
 * DataEngine handles fetching and searching of Quiniela results from Google Sheets.
 */
class DataEngine {
    constructor() {
        // ... (existing spreadsheet URL)
        this.url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMObz19KSMXtEAcdhQzfXb8yPcMLPDjKwZjy0PyC15coaU2JLD--RwVFMoXH1BuMvc_htUoVtHos2a/pub?output=csv";
        
        // Official Liga MX Team Logos
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
            "Atlético San Luis": "https://img.vavel.com/atletico-san-luis-logo.png"
        };

        // Full Liga MX Clausura 2025 Calendar
        this.LIGA_CALENDAR = [
            {
                id: 13,
                name: "JORNADA 13",
                endDate: "2026-03-31T23:59:59",
                matches: [
                    { local: "Puebla", visita: "Tigres" },
                    { local: "América", visita: "Atlético San Luis" },
                    { local: "Mazatlán", visita: "Tijuana" },
                    { local: "Pachuca", visita: "Toluca" },
                    { local: "Monterrey", visita: "Chivas" },
                    { local: "Pumas", visita: "Cruz Azul" },
                    { local: "Atlas", visita: "Querétaro" },
                    { local: "Necaxa", visita: "León" },
                    { local: "Juárez", visita: "Santos" }
                ]
            },
            {
                id: 14,
                name: "JORNADA 14",
                endDate: "2026-04-06T23:59:59",
                startDate: "2026-04-04T19:00:00",
                matches: [
                    { local: "Querétaro", visita: "León" },
                    { local: "Tijuana", visita: "Necaxa" },
                    { local: "Puebla", visita: "Tigres" },
                    { local: "Atlas", visita: "Juárez" },
                    { local: "Pachuca", visita: "América" },
                    { local: "Monterrey", visita: "Chivas" },
                    { local: "Cruz Azul", visita: "Pumas" },
                    { local: "Toluca", visita: "Santos" },
                    { local: "Atlético San Luis", visita: "Mazatlán" }
                ]
            },
            {
                id: 15,
                name: "JORNADA 15",
                endDate: "2026-04-14T23:59:59",
                startDate: "2026-04-11T19:00:00",
                matches: [
                    { local: "Necaxa", visita: "Pachuca" },
                    { local: "Mazatlán", visita: "Chivas" },
                    { local: "Pumas", visita: "Juárez" },
                    { local: "León", visita: "Puebla" },
                    { local: "Atlas", visita: "Toluca" },
                    { local: "Tigres", visita: "Monterrey" },
                    { local: "América", visita: "Cruz Azul" },
                    { local: "Santos", visita: "Querétaro" },
                    { local: "Atlético San Luis", visita: "Tijuana" }
                ]
            }
        ];

        this.data = [];
    }

    getActiveJornada() {
        const now = new Date();
        // Return the first jornada in the calendar that hasn't ended yet
        for (const jornada of this.LIGA_CALENDAR) {
            const endDate = new Date(jornada.endDate);
            if (now <= endDate) {
                return jornada;
            }
        }
        // Final fallback to the last stored jornada
        return this.LIGA_CALENDAR[this.LIGA_CALENDAR.length - 1];
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
