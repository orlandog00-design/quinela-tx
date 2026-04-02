// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // --- DOM SELECTIONS ---
    const sideBetToggle = document.getElementById('side-bet-toggle');
    const sideBetInput = document.getElementById('side-bet-input');
    const totalDisplay = document.getElementById('total-display-banner');
    const paypalBtn = document.getElementById('pay-paypal');
    
    const PAYPAL_LINK_10 = "https://www.paypal.com/ncp/payment/BDGD5KMEYE8";
    const PAYPAL_LINK_13 = "https://www.paypal.com/ncp/payment/R9R6572GVF3GQ";
    const PAYPAL_LINK_3 = "https://www.paypal.com/ncp/payment/A6NMN962TRWNE";

    // --- JACKPOT DYNAMIC LOGIC ---
    if (sideBetToggle) {
        sideBetToggle.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            if (sideBetInput) sideBetInput.style.display = isChecked ? 'block' : 'none';
            
            if (isChecked) {
                if (totalDisplay) totalDisplay.textContent = `2. REALIZA TU PAGO ($13 USD / $225 MXN)`;
                if (paypalBtn) paypalBtn.href = PAYPAL_LINK_13;
                
                if (!document.getElementById('extra-pay-info') && paypalBtn) {
                    const extraInfo = document.createElement('p');
                    extraInfo.id = "extra-pay-info";
                    extraInfo.style.fontSize = "0.75rem";
                    extraInfo.style.marginTop = "0.8rem";
                    extraInfo.style.color = "var(--text-muted)";
                    extraInfo.innerHTML = `¿Ya pagaste los $10? <a href="${PAYPAL_LINK_3}" target="_blank" style="color: #ffd700; font-weight: 700;">Solo Pagar Jackpot ($3)</a>`;
                    paypalBtn.parentNode.appendChild(extraInfo);
                }
            } else {
                if (totalDisplay) totalDisplay.textContent = `2. REALIZA TU PAGO ($10 USD / $175 MXN)`;
                if (paypalBtn) paypalBtn.href = PAYPAL_LINK_10;
                const extra = document.getElementById('extra-pay-info');
                if (extra) extra.remove();
            }
        });
    }

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

    function unlockIfReady() {
        const totalPicks = document.querySelectorAll('.choice-box.active').length;
        const matchesComplete = totalPicks === 9; // Mandatory: all 9 matches
        
        if ((paypalDone || zelleDone) && matchesComplete) {
            finalizeBtn.disabled = false;
            finalizeBtn.style.opacity = "1";
            finalizeBtn.style.cursor = "pointer";
            lockMsg.style.color = "var(--primary-neon)";
            lockMsg.textContent = "✓ ¡Picks y Pago listos! Finaliza ahora.";
        } else {
            finalizeBtn.disabled = true;
            finalizeBtn.style.opacity = "0.5";
            
            if (!matchesComplete) {
                lockMsg.textContent = `⚠ Selecciona todos los partidos (${totalPicks}/9)`;
                lockMsg.style.color = "var(--secondary-magenta)";
            } else {
                lockMsg.textContent = "⚠ Pendiente: Completa tu pago arriba.";
                lockMsg.style.color = "var(--accent-yellow)";
            }
        }
    }

    function attachChoiceListeners() {
        const choiceBoxes = document.querySelectorAll('.choice-box');
        choiceBoxes.forEach(box => {
            box.addEventListener('click', () => {
                const row = box.parentElement.parentElement;
                row.querySelectorAll('.choice-box').forEach(b => b.classList.remove('active'));
                box.classList.add('active');
                unlockIfReady(); // Check status on every pick
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
                
                // --- REGISTRATION LOGIC ---
                const form = document.querySelector('#register-form');
                if (form) {
                    form.addEventListener('submit', async (e) => {
                        e.preventDefault();
                        
                        const picksArray = Array.from(document.querySelectorAll('.choice-box.active')).map(b => b.textContent);
                        if (picksArray.length < 9) {
                            alert('⚠️ Por favor completa los 9 picks de la jornada.');
                            return;
                        }

                        const nombre = document.getElementById('user-name').value;
                        const totalGolesPick = document.getElementById('total-goles-pick') ? document.getElementById('total-goles-pick').value : "N/A";
                        const sideBetToggle = document.getElementById('side-bet-toggle');
                        const isSideBet = sideBetToggle && sideBetToggle.checked;

                        // WhatsApp redirection
                        let message = `¡Hola Sports King! Mi registro es:\n\n👤 *Nombre:* ${nombre}\n⚽ *Picks:* ${picksArray.join('-')}`;
                        if (isSideBet) {
                            message += `\n🏆 *JACKPOT EXTRA:* Sí (Predicción: ${totalGolesPick} goles)`;
                            message += `\n💰 *Total Pagado:* $13 USD`;
                        } else {
                            message += `\n💰 *Total Pagado:* $10 USD`;
                        }
                        
                        const waUrl = `https://wa.me/12057671414?text=${encodeURIComponent(message)}`;
                        window.open(waUrl, '_blank');
                    });
                }

                const message = `*SPORTS KING QUINIELA*\n\n` +
                                `*Nombre:* ${name}\n` +
                                `*Celular:* ${phone}\n` +
                                `*Pronóstico:* ${picks}\n` +
                                `*Pago:* ${pMethodMsg}\n\n` +
                                `_He finalizado mi registro y pago._`;
                
                const waUrl = `https://wa.me/${adminPhone}?text=${encodeURIComponent(message)}`;
                
                // 4. Open WhatsApp in NEW TAB
                window.open(waUrl, '_blank');

                // 5. Show Success Message on Main Page
                const registroSection = document.getElementById('registro');
                if (registroSection) {
                    registroSection.innerHTML = `
                        <div class="success-message" style="text-align: center; padding: 4rem 2rem; border: 2px solid var(--primary-neon); border-radius: 12px; background: rgba(0, 245, 255, 0.05);">
                            <h1 style="color: var(--primary-neon); font-size: 2.5rem; margin-bottom: 1rem; text-shadow: 0 0 20px var(--primary-neon);">¡REGISTRO FINALIZADO!</h1>
                            <p style="color: #fff; font-size: 1.5rem; font-weight: 800;">🏆 ¡BUENA SUERTE! 🏆</p>
                            <p style="color: var(--text-muted); margin-top: 2rem; font-size: 0.9rem;">Tu participación ya está guardada en nuestra base de datos.</p>
                            <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 2rem; width: auto; padding: 0 2rem;">REGISTRAR OTRA</button>
                        </div>
                    `;
                }
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
