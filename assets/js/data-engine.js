// assets/js/data-engine.js

/**
 * DataEngine handles fetching and searching of Quiniela results from Google Sheets.
 */
class DataEngine {
    constructor() {
        // Read URL (CSV)
        this.url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTMObz19KSMXtEAcdhQzfXb8yPcMLPDjKwZjy0PyC15coaU2JLD--RwVFMoXH1BuMvc_htUoVtHos2a/pub?output=csv";

        // Write URL (Google Apps Script - Master Final v4.1 ID FIXED)
        this.scriptUrl = "https://script.google.com/macros/s/AKfycbzyPY_kvQIKw8-Ih-vGqRY6ov9w3X9xy3qr9hSV8xsB7u1FOFupoWi1cZi4BQOUmBcJ/exec";

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
                endDate: "2026-04-05T23:59:59",
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
        this.selectedJornadaId = this.getActiveJornada().id;
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

    async fetchData(jornadaId = null) {
        if (jornadaId) this.selectedJornadaId = parseInt(jornadaId);
        
        try {
            // Using Apps Script JSON API instead of CSV for 100% reliability with Multi-Tabs
            const apiUrl = `${this.scriptUrl}?action=fetch&jornada=${this.selectedJornadaId}&t=${Date.now()}`;
            const response = await fetch(apiUrl);
            
            if (!response.ok) throw new Error("API Fetch failed");
            
            const rawData = await response.json();

            // Find System Rows (Official results are stored in the spreadsheet too)
            // They should be rows where 'nombre' is special
            const officialRow = rawData.find(item =>
                item.nombre && (item.nombre.toUpperCase() === "RESULTADOS_OFICIALES" || item.nombre.toUpperCase() === "OFFICIAL_RESULTS")
            );

            const liveScoresRow = rawData.find(item =>
                item.nombre && (item.nombre.toUpperCase() === "MARCADORES_VIVO" || item.nombre.toUpperCase() === "LIVE_SCORES")
            );

            this.officialPicks = officialRow ? officialRow.predicciones.split('-') : [];
            this.liveScores = liveScoresRow ? liveScoresRow.predicciones.split('-') : [];

            // Attempt to dynamically sync from ESPN
            const targetJornada = this.LIGA_CALENDAR.find(j => j.id === this.selectedJornadaId) || this.getActiveJornada();
            await this.syncFotMob(targetJornada);

            this.data = rawData.filter(item => {
                const n = (item.nombre || item.participante || "").toString().toUpperCase();
                
                // Detect Jornada (from 'jornada' header or fallback)
                const itemJornada = parseInt(item.jornada || 0);
                const targetJornada = parseInt(this.selectedJornadaId);
                
                if (n === "" || ["RESULTADOS_OFICIALES", "MARCADORES_VIVO", "SYSTEM"].includes(n)) return false;

                // STRICT FILTERING: If a jornada is specified, it MUST match the selected one.
                // If J13 is closed and J14 is selected, hide J13 people.
                if (itemJornada > 0) {
                    return itemJornada === targetJornada;
                }
                
                // Fallback for older records without a jornada column (legacy)
                return targetJornada === 13; // Assume legacy rows were from the first week (J13)
            }).map(p => {
                // Detect picks from varied header names
                const rawPicks = p.picks || p.predicciones || p['los 9 pronósticos'] || "";
                const pPicks = rawPicks.toString().split('-');
                
                // Detect status
                const pStatus = (p.status || p.estatus || p.estado || "PAGADO").toString().toUpperCase();

                let computedPts = 0;
                const status = pPicks.map((pick, index) => {
                    const official = this.officialPicks[index];
                    if (!official || official === "" || official === "?") return 'pending';
                    const isCorrect = pick.trim().toUpperCase() === official.trim().toUpperCase();
                    if (isCorrect) computedPts++;
                    return isCorrect ? 'correct' : 'incorrect';
                });

                return {
                    ...p,
                    nombre: p.nombre || p.participante,
                    pts: parseInt(p.puntos || p.pts) || computedPts,
                    computedPts: computedPts,
                    pickStatus: status,
                    paymentStatus: pStatus,
                    whatsapp: p.whatsapp || p.telefono,
                    jackpot_goles: p.jackpot_goles || p['goles jackpot'] || "NO"
                };
            });

            // Sort by Points (Highest first)
            this.data.sort((a, b) => (b.pts || b.computedPts) - (a.pts || a.computedPts));

            console.log(`Synced Jornada ${this.selectedJornadaId}. Participants: ${this.data.length}`);
            return this.data;
        } catch (error) {
            console.error("Error fetching data from API:", error);
            return [];
        }
    }

    getWinners() {
        if (!this.data || this.data.length === 0) return [];
        const maxPts = Math.max(...this.data.map(p => p.computedPts || p.pts));
        if (maxPts === 0 && this.officialPicks.every(p => p === "?")) return []; // Don't show winners if no games played
        return this.data.filter(p => (p.computedPts || p.pts) === maxPts && (p.computedPts || p.pts) > 0);
    }

    async registerParticipant(data) {
        try {
            // Include all robust fields for v3.5
            const payload = {
                nombre: data.nombre,
                whatsapp: data.telefono, // Mapping for backend
                picks: data.predicciones, // Mapping for backend
                jackpot_goles: data.jackpot_goles || "NO",
                pago_metodo: data.metodo_pago || "NONE", // Mapping for backend
                status: data.status || "PENDIENTE",
                jornada: data.jornada || this.selectedJornadaId,
                total_pago: data.jackpot_goles !== "NO" ? "$13 USD / $225 MXN" : "$10 USD / $175 MXN",
                comprobante_base64: data.comprobante_base64 || ""
            };

            // Using fetch with no-cors for Google Apps Script POST
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
            // Compute a safe date range from the jornada to ensure all older matches are returned
            let startDateStr = "";
            let endDateStr = "";
            if (jornada.startDate && jornada.endDate) {
                const sDate = new Date(jornada.startDate);
                sDate.setDate(sDate.getDate() - 5);
                startDateStr = sDate.toISOString().split('T')[0].replace(/-/g, '');

                const eDate = new Date(jornada.endDate);
                eDate.setDate(eDate.getDate() + 2);
                endDateStr = eDate.toISOString().split('T')[0].replace(/-/g, '');
            } else {
                startDateStr = "20240101";
                endDateStr = "20261231";
            }

            // Using ESPN API with explicit dates to include older matches in the round
            const espnUrl = `https://site.api.espn.com/apis/site/v2/sports/soccer/mex.1/scoreboard?dates=${startDateStr}-${endDateStr}`;

            let response;
            try {
                response = await fetch(espnUrl);
            } catch (e) {
                // Fallback proxy if strict CORS blocks direct ESPN fetch
                const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(espnUrl);
                response = await fetch(proxyUrl);
            }

            const data = await response.json();

            if (data && data.events) {
                const espnMatches = data.events;

                const normalize = (str) => {
                    if (!str) return "";
                    return str.toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
                        .replace("atletico de san luis", "atletico san luis")
                        .replace("guadalajara", "chivas")
                        .replace("monterrey", "rayados")
                        .replace("u.n.a.m.", "pumas")
                        .replace("univerisdad nacional", "pumas")
                        .replace("club america", "america")
                        .replace("deportivo toluca", "toluca");
                };

                let computedOfficialPicks = [];
                let computedLiveScores = [];

                jornada.matches.forEach((appMatch) => {
                    const localNorm = normalize(appMatch.local);
                    const visitaNorm = normalize(appMatch.visita);

                    const espnMatch = espnMatches.find(m => {
                        const eventName = normalize(m.name);
                        const comp1 = m.competitions[0]?.competitors[0]?.team?.name ? normalize(m.competitions[0].competitors[0].team.name) : "";
                        const comp2 = m.competitions[0]?.competitors[1]?.team?.name ? normalize(m.competitions[0].competitors[1].team.name) : "";
                        return (eventName.includes(localNorm) || comp1.includes(localNorm) || comp2.includes(localNorm)) &&
                            (eventName.includes(visitaNorm) || comp1.includes(visitaNorm) || comp2.includes(visitaNorm));
                    });

                    if (espnMatch && espnMatch.competitions && espnMatch.competitions[0]) {
                        const status = espnMatch.status.type.state; // 'pre', 'in', 'post'
                        const comps = espnMatch.competitions[0].competitors;

                        const homeTeam = comps.find(c => c.homeAway === 'home') || comps[0];
                        const awayTeam = comps.find(c => c.homeAway === 'away') || comps[1];

                        if (status === 'in' || status === 'post') {
                            const homeScore = parseInt(homeTeam.score) || 0;
                            const awayScore = parseInt(awayTeam.score) || 0;
                            computedLiveScores.push(`${homeScore} - ${awayScore}`);

                            if (status === 'post') {
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
            console.error("ESPN auto-sync failed:", error);
        }
    }
}

// Initialize the data engine with the user's live Google Sheet
const engine = new DataEngine();
