// assets/js/data-engine.js

/**
 * DataEngine handles fetching and searching of Quiniela results from Google Sheets.
 */
class DataEngine {
    constructor() {
        // Read URL (CSV)
        this.url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMObz19KSMXtEAcdhQzfXb8yPcMLPDjKwZjy0PyC15coaU2JLD--RwVFMoXH1BuMvc_htUoVtHos2a/pub?output=csv";
        
        // Write URL (Google Apps Script - Mandatory for Registration)
        this.scriptUrl = "https://script.google.com/macros/s/AKfycbywJeMQcBb-b54z7IDL65v3CYNHFnk6PmeWKGH9wUg9PtSssRgf1CrxkatrPPx4MpOV/exec";
        
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
            // Cache-buster to ensure mobile browsers get FRESH data from the sheet
            const cacheBustedUrl = this.url + (this.url.includes("?") ? "&" : "?") + "t=" + Date.now();
            const response = await fetch(cacheBustedUrl);
            const csvText = await response.text();
            
            // Simple CSV to JSON Parser
            const lines = csvText.split('\n');
            const headers = lines[0].split(',');
            
            const rawData = lines.slice(1).map(line => {
                const values = line.split(',');
                if (values.length < 3) return null;
                return {
                    nombre: values[0]?.trim(),
                    predicciones: values[1]?.trim(),
                    pts: parseInt(values[2]?.trim()) || 0,
                    telefono: values[3]?.trim(),
                    status: values[4]?.trim() || "PENDIENTE"
                };
            }).filter(item => item !== null && item.nombre !== "");

            // Find the Official Results row
            const officialRow = rawData.find(item => 
                item.nombre.toUpperCase() === "RESULTADOS_OFICIALES" || 
                item.nombre.toUpperCase() === "OFFICIAL_RESULTS"
            );

            // Find the Live Scores row (NEW)
            const liveScoresRow = rawData.find(item => 
                item.nombre.toUpperCase() === "MARCADORES_VIVO" || 
                item.nombre.toUpperCase() === "LIVE_SCORES"
            );

            this.officialPicks = officialRow ? officialRow.predicciones.split('-') : [];
            this.liveScores = liveScoresRow ? liveScoresRow.predicciones.split('-') : [];
            
            // Attempt to dynamically sync from FotMob to populate missing live scores and official results
            await this.syncFotMob(this.getActiveJornada());
            
            // Process participants
            this.data = rawData.filter(item => item !== officialRow && item !== liveScoresRow).map(p => {
                const pPicks = p.predicciones.split('-');
                let computedPts = 0;
                const status = pPicks.map((pick, index) => {
                    const official = this.officialPicks[index];
                    if (!official || official === "" || official === "?") return 'pending';
                    const isCorrect = pick.toUpperCase() === official.toUpperCase();
                    if (isCorrect) computedPts++;
                    return isCorrect ? 'correct' : 'incorrect';
                });

                return {
                    ...p,
                    computedPts: computedPts, // We use this for highlighting
                    pickStatus: status,
                    paymentStatus: p.status // This will be used in Verificador
                };
            });

            // Sort by Points (Highest first)
            this.data.sort((a, b) => (b.pts || b.computedPts) - (a.pts || a.computedPts));

            return this.data;
        } catch (error) {
            console.error("Error fetching data:", error);
            return [];
        }
    }

    async registerParticipant(data) {
        try {
            // Initial status is PENDIENTE until the admin verifies the funds
            const payload = {
                nombre: data.nombre,
                predicciones: data.predicciones,
                poblacion: data.telefono,  
                metodo_pago: data.metodo_pago || "NONE",
                status: "PENDIENTE"
            };
            
            // Note: Google Apps Script requires no-cors for simple browser POSTs
            await fetch(this.scriptUrl, {
                method: "POST",
                mode: "no-cors", 
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });
            
            return true; // We always return true for no-cors as it won't show response.ok
        } catch (error) {
            console.error("Error registering participant:", error);
            return false;
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

    async syncFotMob(jornada) {
        if (!jornada || !jornada.matches) return;
        
        try {
            // League 130 is Liga MX
            const fotmobUrl = "https://www.fotmob.com/api/leagues?id=130";
            const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(fotmobUrl);
            const response = await fetch(proxyUrl);
            const data = await response.json();
            
            if (data && data.matches && data.matches.allMatches) {
                const fotmobMatches = data.matches.allMatches;
                
                const normalize = (str) => {
                    if (!str) return "";
                    return str.toLowerCase()
                              .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                              .replace("atletico de san luis", "atletico san luis")
                              .replace("guadalajara", "chivas")
                              .replace("monterrey", "rayados");
                };

                let computedOfficialPicks = [];
                let computedLiveScores = [];

                jornada.matches.forEach((appMatch) => {
                    const localNorm = normalize(appMatch.local);
                    const visitaNorm = normalize(appMatch.visita);
                    
                    const fotMatch = fotmobMatches.find(m => {
                        const h = normalize(m.home?.name);
                        const a = normalize(m.away?.name);
                        return (h.includes(localNorm) || localNorm.includes(h)) && 
                               (a.includes(visitaNorm) || visitaNorm.includes(a));
                    });

                    if (fotMatch && fotMatch.status && fotMatch.status.started) {
                        // Extract numeric scores
                        let homeScore = 0; let awayScore = 0;
                        if (fotMatch.status.scoreStr) {
                            const parts = fotMatch.status.scoreStr.split(' - ');
                            homeScore = parseInt(parts[0]) || 0;
                            awayScore = parseInt(parts[1]) || 0;
                            computedLiveScores.push(`${homeScore} - ${awayScore}`);
                        } else {
                            computedLiveScores.push("VS");
                        }
                        
                        if (fotMatch.status.finished) {
                            if (homeScore > awayScore) computedOfficialPicks.push("L");
                            else if (homeScore < awayScore) computedOfficialPicks.push("V");
                            else computedOfficialPicks.push("E");
                        } else {
                            computedOfficialPicks.push("?"); // match still playing
                        }
                    } else {
                        computedLiveScores.push("VS");
                        computedOfficialPicks.push("?");
                    }
                });

                if (this.officialPicks.length === 0 || computedOfficialPicks.some(p => p !== "?")) {
                    this.officialPicks = computedOfficialPicks;
                }
                if (this.liveScores.length === 0 || computedLiveScores.some(s => s !== "VS")) {
                    this.liveScores = computedLiveScores;
                }
            }
        } catch (error) {
            console.error("FotMob auto-sync failed:", error);
        }
    }
}

// Initialize the data engine with the user's live Google Sheet
const engine = new DataEngine();
