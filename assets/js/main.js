// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DYNAMIC MATCH ENGINE (ULTIMATE AUTOMATION) ---
    const matchList = document.getElementById('match-list');
    const jornadaDisplay = document.getElementById('jornada-display');
    const regIniciaDisplay = document.getElementById('reg-inicia');
    const regCierreDisplay = document.getElementById('reg-cierre');
    
    // Get the active Jornada based on today's date
    const activeJornada = engine.getActiveJornada();

    function renderMatches(matches) {
        if (!matchList) return;
        matchList.innerHTML = "";
        
        // Update header & windows
        if (jornadaDisplay) jornadaDisplay.textContent = activeJornada.name;
        if (regIniciaDisplay) regIniciaDisplay.textContent = activeJornada.inicia || "--/--/----";
        if (regCierreDisplay) regCierreDisplay.textContent = activeJornada.cierre || "--/--/----";
        
        matches.forEach(match => {
            const row = document.createElement('tr');
            
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

    if (activeJornada && activeJornada.matches) {
        renderMatches(activeJornada.matches);
    }

    // --- PAYMENT LOCKDOWN LOGIC ---
    const btnPaypal = document.getElementById('pay-paypal');
    const btnZelle = document.getElementById('pay-zelle');
    const zelleInstructions = document.getElementById('zelle-instructions');
    const zelleScreenshot = document.getElementById('zelle-screenshot');
    const finalizeBtn = document.getElementById('finalizar-btn');
    const lockMsg = document.getElementById('lock-msg');
    
    let paymentMethod = "";
    let paypalDone = false;
    let zelleDone = false;

    function unlockIfReady() {
        if (paypalDone || zelleDone) {
            finalizeBtn.disabled = false;
            finalizeBtn.style.opacity = "1";
            finalizeBtn.style.cursor = "pointer";
            lockMsg.style.color = "var(--primary-neon)";
            lockMsg.textContent = "✓ ¡Listo para finalizar!";
        }
    }

    if (btnPaypal) {
        btnPaypal.addEventListener('click', () => {
            window.open('https://www.paypal.com/ncp/payment/BDGD5MXKMEYE8', '_blank');
            paymentMethod = "PAYPAL";
            paypalDone = true;
            zelleDone = false;
            if (zelleInstructions) zelleInstructions.style.display = "none";
            unlockIfReady();
        });
    }

    if (btnZelle) {
        btnZelle.addEventListener('click', () => {
            if (zelleInstructions) zelleInstructions.style.display = "block";
            paymentMethod = "ZELLE";
            paypalDone = false;
            // Zelle requires the screenshot to unlock
        });
    }

    if (zelleScreenshot) {
        zelleScreenshot.addEventListener('change', () => {
            if (zelleScreenshot.files.length > 0) {
                zelleDone = true;
                unlockIfReady();
            }
        });
    }

    // --- FORM SUBMISSION & WHATSAPP REDIRECT ---
    const predictionForm = document.getElementById('prediction-form');
    if (predictionForm) {
        predictionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('user-name').value;
            const phone = document.getElementById('user-phone').value;
            const picks = Array.from(document.querySelectorAll('.choice-box.active'))
                                .map(box => box.textContent).join('-');

            if (picks.split('-').length < 9) {
                alert("Por favor, selecciona ganador para todos los partidos.");
                return;
            }

            // 1. Show loading
            finalizeBtn.textContent = "REGISTRANDO...";
            finalizeBtn.disabled = true;

            // 2. Register in Google Sheets (Autonomous)
            const success = await engine.registerParticipant({
                nombre: name,
                telefono: phone,
                predicciones: picks,
                metodo_pago: paymentMethod,
                status: "PAGADO"
            });

            if (success) {
                // 3. Build WhatsApp Message (Admin: 12057671414)
                const adminPhone = "12057671414";
                const pMethodMsg = paymentMethod === "ZELLE" ? "ZELLE (Adjunto captura)" : "PAYPAL";
                const message = `*SPORTS KING QUINIELA*\n\n` +
                                `*Nombre:* ${name}\n` +
                                `*Celular:* ${phone}\n` +
                                `*Pronóstico:* ${picks}\n` +
                                `*Pago:* ${pMethodMsg}\n\n` +
                                `_He finalizado mi registro y pago._`;
                
                const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
                window.location.href = waUrl;
            } else {
                alert("Hubo un error al registrar. Intenta de nuevo.");
                finalizeBtn.textContent = "Finaliza Tu Registro";
                finalizeBtn.disabled = false;
            }
        });
    }

    // --- SIMPLE COUNTDOWN (SYNC WITH JORNADA START) ---
    const countdownElement = document.getElementById('countdown');
    if (countdownElement && activeJornada) {
        const targetDate = new Date(activeJornada.startDate).getTime();

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;

            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            if (distance < 0) {
                clearInterval(timer);
                countdownElement.textContent = "¡REGISTRO CERRADO!";
            }
        }, 1000);
    }
});
