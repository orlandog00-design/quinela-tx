// assets/js/main.js

// --- GLOBAL JACKPOT LOGIC (BULLETPROOF) ---
window.updateJackpotLinks = function() {
    const sideBetToggle = document.getElementById('side-bet-toggle');
    const sideBetInput = document.getElementById('side-bet-input');
    const totalDisplay = document.getElementById('total-display-banner');
    const paypalBtn = document.getElementById('pay-paypal');
    
    // Exact links provided by user
    const PAYPAL_LINK_10 = "https://www.paypal.com/ncp/payment/BDGD5MXKMEYE8";
    const PAYPAL_LINK_13 = "https://www.paypal.com/ncp/payment/R9R6572GVF3GQ";
    const PAYPAL_LINK_3 = "https://www.paypal.com/ncp/payment/A6NMN962TRWNE";

    if (sideBetToggle) {
        const isChecked = sideBetToggle.checked;
        if (sideBetInput) sideBetInput.style.display = isChecked ? 'block' : 'none';
        
        if (isChecked) {
            if (totalDisplay) totalDisplay.textContent = `2. REALIZA TU PAGO ($13 USD / $225 MXN)`;
            if (paypalBtn) paypalBtn.href = PAYPAL_LINK_13;
            
            if (!document.getElementById('extra-pay-info') && paypalBtn) {
                const extraInfo = document.createElement('p');
                extraInfo.id = "extra-pay-info";
                extraInfo.className = "extra-info-text";
                extraInfo.style.fontSize = "0.75rem";
                extraInfo.style.marginTop = "0.8rem";
                extraInfo.style.color = "rgba(255,255,255,0.6)";
                extraInfo.innerHTML = `¿Ya pagaste los $10? <a href="${PAYPAL_LINK_3}" target="_blank" style="color: #ffd700; font-weight: 700;">Solo Pagar Jackpot ($3)</a>`;
                paypalBtn.parentNode.appendChild(extraInfo);
            }
        } else {
            if (totalDisplay) totalDisplay.textContent = `2. REALIZA TU PAGO ($10 USD / $175 MXN)`;
            if (paypalBtn) paypalBtn.href = PAYPAL_LINK_10;
            const extra = document.getElementById('extra-pay-info');
            if (extra) extra.remove();
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // --- MOBILE MENU TOGGLE ---
    const menuToggle = document.getElementById('menu-toggle');
    const navMenu = document.getElementById('nav-menu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navMenu.classList.toggle('active');
            menuToggle.innerHTML = navMenu.classList.contains('active') ? '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });

        // Close when clicking a link
        navMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            });
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!navMenu.contains(e.target) && !menuToggle.contains(e.target)) {
                navMenu.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    }

    // 1. Core Selections
    const matchList = document.getElementById('match-list');
    const jornadaDisplay = document.getElementById('jornada-display');
    const countdownElement = document.getElementById('countdown');
    const predictionForm = document.getElementById('prediction-form');
    const sideBetToggle = document.getElementById('side-bet-toggle');
    const zelleInstructions = document.getElementById('zelle-instructions');
    const zelleScreenshot = document.getElementById('zelle-screenshot');
    const finalizeBtn = document.getElementById('finalizar-btn');
    const lockMsg = document.getElementById('lock-msg');
    
    // State
    let paymentMethod = "";
    let paypalDone = false;
    let zelleDone = false;
    const activeJornada = engine.getActiveJornada();

    // 2. Initialize Jackpot State
    window.updateJackpotLinks();
    if (sideBetToggle) {
        sideBetToggle.addEventListener('change', window.updateJackpotLinks);
    }

    // 3. Render Matches
    if (activeJornada && activeJornada.matches && matchList) {
        matchList.innerHTML = "";
        
        // Dynamic Titles and Headers
        document.title = `SPORTS KING QUINIELA | LIGA MX ${activeJornada.name}`;
        if (jornadaDisplay) jornadaDisplay.textContent = activeJornada.name;
        
        const regIniciaEl = document.getElementById('reg-inicia');
        const regCierreEl = document.getElementById('reg-cierre');
        if (regIniciaEl) regIniciaEl.textContent = activeJornada.inicia || "--/--/----";
        if (regCierreEl) regCierreEl.textContent = activeJornada.cierre || "--/--/----";

        activeJornada.matches.forEach(match => {
            const row = document.createElement('tr');
            const localLogo = engine.TEAM_LOGOS[match.local] || "https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_Unknown.png";
            const visitaLogo = engine.TEAM_LOGOS[match.visita] || "https://upload.wikimedia.org/wikipedia/commons/2/2f/Logo_Unknown.png";
            
            row.innerHTML = `
                <td>
                    <div class="team-row">
                        <div class="team-info"><img src="${localLogo}" class="team-logo"><span>${match.local}</span></div>
                        <div class="match-vs">VS</div>
                        <div class="team-info"><img src="${visitaLogo}" class="team-logo"><span>${match.visita}</span></div>
                    </div>
                </td>
                <td><span class="choice-box">L</span></td>
                <td><span class="choice-box">E</span></td>
                <td><span class="choice-box">V</span></td>
            `;
            matchList.appendChild(row);
        });

        // Attach pick listeners
        document.querySelectorAll('.choice-box').forEach(box => {
            box.addEventListener('click', () => {
                const row = box.closest('tr');
                row.querySelectorAll('.choice-box').forEach(b => b.classList.remove('active'));
                box.classList.add('active');
                checkStatus();
            });
        });

        // 3.5 Update Homepage Prize Pool
        updateHomePrizePool();
    }

    async function updateHomePrizePool() {
        const results = await engine.fetchData();
        const paidParticipants = results.filter(p => p.status === "PAGADO").length;

        const prizeUsdEl = document.getElementById('home-prize-usd');
        const prizeMxnEl = document.getElementById('home-prize-mxn');

        if (paidParticipants < 5) {
            if (prizeUsdEl) prizeUsdEl.textContent = "TBD";
            if (prizeMxnEl) prizeMxnEl.textContent = "Esperando participantes...";
        } else {
            const prizeUSD = paidParticipants * 10;
            const prizeMXN = prizeUSD * 17.5;
            if (prizeUsdEl) prizeUsdEl.textContent = `$${prizeUSD} USD`;
            if (prizeMxnEl) prizeMxnEl.textContent = `$${prizeMXN.toLocaleString()} MXN`;
        }
    }

    // 4. Unlock Logic
    function checkStatus() {
        const totalPicks = document.querySelectorAll('.choice-box.active').length;
        const matchesComplete = totalPicks === 9;
        
        if ((paypalDone || zelleDone) && matchesComplete) {
            finalizeBtn.disabled = false;
            finalizeBtn.style.opacity = "1";
            finalizeBtn.style.cursor = "pointer";
            lockMsg.style.color = "var(--primary-neon)";
            lockMsg.textContent = "✓ ¡Todo listo! Finaliza ahora.";
        } else {
            finalizeBtn.disabled = true;
            finalizeBtn.style.opacity = "0.5";
            if (!matchesComplete) {
                lockMsg.textContent = `⚠ Selecciona todos los partidos (${totalPicks}/9)`;
                lockMsg.style.color = "var(--secondary-magenta)";
            } else {
                lockMsg.textContent = "⚠ Pendiente: Confirma tu pago arriba.";
                lockMsg.style.color = "var(--accent-yellow)";
            }
        }
    }

    // 5. Payment Listeners
    const btnPaypal = document.getElementById('pay-paypal');
    const btnZelle = document.getElementById('pay-zelle');

    if (btnPaypal) {
        btnPaypal.addEventListener('click', () => {
            paymentMethod = "PAYPAL";
            paypalDone = true;
            zelleDone = false;
            if (zelleInstructions) zelleInstructions.style.display = "none";
            checkStatus();
        });
    }

    if (btnZelle) {
        btnZelle.addEventListener('click', () => {
            paymentMethod = "ZELLE";
            paypalDone = false;
            if (zelleInstructions) zelleInstructions.style.display = "block";
            checkStatus();
        });
    }

    if (zelleScreenshot) {
        zelleScreenshot.addEventListener('change', () => {
            if (zelleScreenshot.files.length > 0) {
                zelleDone = true;
                checkStatus();
            }
        });
    }

    // 6. Form Submission
    if (predictionForm) {
        predictionForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const name = document.getElementById('user-name').value;
            const phone = document.getElementById('user-phone').value;
            const picks = Array.from(document.querySelectorAll('.choice-box.active')).map(box => box.textContent).join('-');
            const totalGoles = document.getElementById('total-goles-pick') ? document.getElementById('total-goles-pick').value : "N/A";
            const sideBetActive = sideBetToggle && sideBetToggle.checked;

            finalizeBtn.textContent = "REGISTRANDO...";
            finalizeBtn.disabled = true;

            const success = await engine.registerParticipant({
                nombre: name,
                telefono: phone,
                predicciones: picks,
                jackpot_goles: sideBetActive ? totalGoles : "NO",
                metodo_pago: paymentMethod,
                status: "PAGADO"
            });

            if (success) {
                const adminPhone = "12057671414";
                const amount = sideBetActive ? "$13 USD / $225 MXN" : "$10 USD / $175 MXN";
                const jackpotMsg = sideBetActive ? `\n🏆 *JACKPOT:* SÍ (Predicción: ${totalGoles} goles)` : "";
                
                const waMessage = `*SPORTS KING QUINIELA*\n\n` +
                                `👤 *Nombre:* ${name}\n` +
                                `📞 *Celular:* ${phone}\n` +
                                `⚽ *Picks:* ${picks}${jackpotMsg}\n` +
                                `💰 *Pago:* ${paymentMethod} (${amount})\n\n` +
                                `_He finalizado mi registro y pago._`;
                
                window.open(`https://wa.me/${adminPhone}?text=${encodeURIComponent(waMessage)}`, '_blank');

                const registroSection = document.getElementById('registro');
                if (registroSection) {
                    registroSection.innerHTML = `
                        <div class="success-message" style="text-align: center; padding: 4rem 2rem; border: 2px solid var(--primary-neon); border-radius: 12px; background: rgba(0, 245, 255, 0.05); animation: neonPulse 2s infinite alternate;">
                            <h1 style="color: var(--primary-neon); font-size: 2.5rem; margin-bottom: 1rem;">¡REGISTRO EXITOSO!</h1>
                            <p style="color: #fff; font-size: 1.5rem; font-weight: 800;">🏆 ¡BUENA SUERTE REY! 🏆</p>
                            <p style="color: var(--text-muted); margin-top: 2rem;">Tu participación ya está guardada en la base de datos.</p>
                            <button onclick="window.location.reload()" class="btn-primary" style="margin-top: 2rem; width: auto; padding: 0 2rem;">REGISTRAR OTRA</button>
                        </div>
                    `;
                }
            } else {
                alert("Error al registrar. Intenta de nuevo.");
                finalizeBtn.textContent = "Finaliza Tu Registro";
                finalizeBtn.disabled = false;
            }
        });
    }

    // 7. Countdown
    if (countdownElement && activeJornada) {
        const targetDate = new Date(activeJornada.startDate).getTime();
        const timer = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetDate - now;
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);
            countdownElement.textContent = distance < 0 ? "¡REGISTRO CERRADO!" : `${days}d ${hours}h ${minutes}m ${seconds}s`;
            if (distance < 0) clearInterval(timer);
        }, 1000);
    }
});
