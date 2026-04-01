// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DYNAMIC MATCH ENGINE (ULTIMATE AUTOMATION) ---
    const matchList = document.getElementById('match-list');
    const jornadaDisplay = document.getElementById('jornada-display');
    
    // Get the active Jornada based on today's date (April 1st)
    const activeJornada = engine.getActiveJornada();

    function renderMatches(matches) {
        if (!matchList) return;
        matchList.innerHTML = "";
        
        // Update header
        if (jornadaDisplay) jornadaDisplay.textContent = activeJornada.name;
        
        matches.forEach(match => {
            const row = document.createElement('tr');
            
            // Get logos from DataEngine registry
            const localLogo = engine.TEAM_LOGOS[match.local] || "https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_Unknown.png";
            const visitaLogo = engine.TEAM_LOGOS[match.visita] || "https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_Unknown.png";
            
            row.innerHTML = `
                <td>
                    <div class="team-row">
                        <div class="team-info">
                            <img src="${localLogo}" class="team-logo" alt="${match.local}">
                            <span>${match.local}</span>
                        </div>
                        <div class="match-vs">VS</div>
                        <div class="team-info">
                            <img src="${visitaLogo}" class="team-logo" alt="${match.visita}">
                            <span>${match.visita}</span>
                        </div>
                    </div>
                </td>
                <td><span class="choice-box">L</span></td>
                <td><span class="choice-box">E</span></td>
                <td><span class="choice-box">V</span></td>
            `;
            matchList.appendChild(row);
        });

        attachChoiceListeners();
    }

    function attachChoiceListeners() {
        const choiceBoxes = document.querySelectorAll('.choice-box');
        choiceBoxes.forEach(box => {
            box.addEventListener('click', () => {
                const row = box.parentElement.parentElement;
                row.querySelectorAll('.choice-box').forEach(b => b.classList.remove('active'));
                box.classList.add('active');
            });
        });
    }

    // Load matches for the current date
    renderMatches(activeJornada.matches);

    // Simple Countdown (Sync with Jornada Start)
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        const targetDate = new Date(activeJornada.startDate || activeJornada.endDate).getTime();
        
        function updateCountdown() {
            const now = new Date().getTime();
            const distance = targetDate - now;
            
            if (distance < 0) {
                countdownElement.textContent = "¡REGIERTO CERRADO!";
                return;
            }

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            
            countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        }
        setInterval(updateCountdown, 1000);
        updateCountdown();
    }
    if (countdownElement) {
        let totalSeconds = (4 * 24 * 3600) + (12 * 3600) + (44 * 60) + 27;
        function updateCountdown() {
            const days = Math.floor(totalSeconds / (24 * 3600));
            const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;
            countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;
            if (totalSeconds > 0) totalSeconds--;
        }
        setInterval(updateCountdown, 1000);
        updateCountdown();
    }

    // Form Submission (Automatic Logging + WhatsApp)
    const form = document.getElementById('prediction-form');
    const submitBtn = form ? form.querySelector('button') : null;
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbywJeMQcBb-b54z7IDL65v3CYNHFnk6PmeWKGH9wUg9PtSssRgf1CrxkatrPPx4MpOV/exec";

    if (form && submitBtn) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = form.querySelector('input[type="text"]').value;
            const phone = form.querySelector('input[type="tel"]').value;
            
            // Gather choices
            const rows = document.querySelectorAll('tbody tr');
            let choices = "";
            rows.forEach((row, index) => {
                const active = row.querySelector('.choice-box.active');
                choices += (active ? active.textContent : '?');
                if (index < rows.length - 1) choices += "-";
            });

            // 1. Show loading state
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = "REGISTRANDO...";
            submitBtn.disabled = true;

            // 2. Automate to Google Sheets
            try {
                await fetch(SCRIPT_URL, {
                    method: 'POST',
                    mode: 'no-cors', // Standard for simple Apps Script POSTs
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        nombre: name,
                        predicciones: choices,
                        poblacion: phone
                    })
                });
                console.log("Registration logged to Google Sheets.");
            } catch (error) {
                console.error("Error logging to Sheets:", error);
            }

            // 3. Open WhatsApp - Send ONLY to the Admin Number (+12057671414)
            const adminPhone = "12057671414";
            const message = `*SPORTS KING QUINIELA*\n*Nombre:* ${name}\n*Predicciones (J13):* ${choices}\n*Población/Cel.:* ${phone}\n\n_He completado mi registro, aguardo confirmación._`;
            const encodedMessage = encodeURIComponent(message);
            
            // Redirect to the Admin (Fixed)
            window.open(`https://wa.me/${adminPhone}?text=${encodedMessage}`, '_blank');

            // 4. Reset button
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
        });
    }
});
