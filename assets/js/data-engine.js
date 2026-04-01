// assets/js/data-engine.js

/**
 * DataEngine handles fetching and searching of Quiniela results from Google Sheets.
 */
class DataEngine {
    constructor() {
        // ... (existing spreadsheet URL)
        this.url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMObz19KSMXtEAcdhQzfXb8yPcMLPDjKwZjy0PyC15coaU2JLD--RwVFMoXH1BuMvc_htUoVtHos2a/pub?output=csv";
        
        // Official Liga MX Team Logos (FotMob CDN - High Reliability)
        const logoBase = "https://images.fotmob.com/image_resources/logo/teamlogo/";
        this.TEAM_LOGOS = {
            "América": `${logoBase}6576.png`,
            "Chivas": `${logoBase}7807.png`,
            "Cruz Azul": `${logoBase}6578.png`,
            "Pumas": `${logoBase}1946.png`,
            "Tigres": `${logoBase}8561.png`,
            "Monterrey": `${logoBase}7849.png`,
            "Toluca": `${logoBase}6618.png`,
            "Pachuca": `${logoBase}7848.png`,
            "León": `${logoBase}1841.png`,
            "Santos": `${logoBase}7857.png`,
            "Atlas": `${logoBase}6577.png`,
            "Necaxa": `${logoBase}1842.png`,
            "Juárez": `${logoBase}649424.png`,
            "Mazatlán": `${logoBase}1170234.png`,
            "Tijuana": `${logoBase}162418.png`,
            "Puebla": `${logoBase}7847.png`,
            "Querétaro": `${logoBase}1943.png`,
            "Atlético San Luis": `${logoBase}6358.png`
        };

        // Full Liga MX Clausura 2026 Calendar (Sync with FotMob)
        this.LIGA_CALENDAR = [
            {
                id: 13,
                name: "JORNADA 13",
                inicia: "31/Mar/2026 Al 3/Abr/2026",
                cierre: "3/Abr/2026 a las 20:00 hrs.",
                endDate: "2026-04-06T23:59:59",
                startDate: "2026-04-03T20:00:00",
                matches: [
                    { local: "Puebla", visita: "Juárez" },
// ... (matches continue)
                    { local: "Necaxa", visita: "Mazatlán" },
                    { local: "Tijuana", visita: "Tigres" },
                    { local: "Monterrey", visita: "Atlético San Luis" },
                    { local: "Querétaro", visita: "Toluca" },
                    { local: "Cruz Azul", visita: "Pachuca" },
                    { local: "León", visita: "Atlas" },
                    { local: "Santos", visita: "América" },
                    { local: "Chivas", visita: "Pumas" }
                ]
            },
            {
                id: 14,
                name: "JORNADA 14",
                inicia: "07/Abr/2026 Al 10/Abr/2026",
                cierre: "10/Abr/2026 a las 20:00 hrs.",
                endDate: "2026-04-13T23:59:59",
                startDate: "2026-04-10T20:00:00",
                matches: [
                    { local: "Puebla", visita: "León" },
// ... (rest remains)
                    { local: "Juárez", visita: "Tijuana" },
                    { local: "Querétaro", visita: "Necaxa" },
                    { local: "Tigres", visita: "Chivas" },
                    { local: "Atlas", visita: "Monterrey" },
                    { local: "Pachuca", visita: "Santos" },
                    { local: "América", visita: "Cruz Azul" },
                    { local: "Pumas", visita: "Mazatlán" },
                    { local: "Toluca", visita: "Atlético San Luis" }
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
