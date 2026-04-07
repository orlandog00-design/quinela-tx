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

document.addEventListener('DOMContentLoaded', async () => {
    // console.log("SPORTS KING ENGINE: ACTIVE_VERSION_v3.5");
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

    const matchList = document.getElementById('match-list');
    const jornadaDisplay = document.getElementById('jornada-display');
    const countdownElement = document.getElementById('countdown');
    const predictionForm = document.getElementById('prediction-form');
    const sideBetToggle = document.getElementById('side-bet-toggle');
    const zelleInstructions = document.getElementById('zelle-instructions');
    const zelleScreenshot = document.getElementById('zelle-screenshot');
    const finalizeBtn = document.getElementById('finalizar-btn');
    const lockMsg = document.getElementById('lock-msg');
    const homeJornadaSelect = document.getElementById('jornada-select-home');
    const predictionSection = document.getElementById('registro');
    
    // State
    let paymentMethod = "";
    let paypalDone = false;
    let zelleDone = false;
    let activeJornadaGlobal = engine.getActiveJornada();

    // 2. Initialize Dropdowns (Home)
    if (homeJornadaSelect) {
        const activeId = activeJornadaGlobal.id;
        engine.LIGA_CALENDAR.forEach(j => {
            const opt = document.createElement('option');
            opt.value = j.id;
            let label = j.name;
            if (j.id < activeId) label += " (CERRADA)";
            else if (j.id === activeId) label += " (ACTIVA)";
            opt.textContent = label;
            if (j.id === activeId) opt.selected = true;
            homeJornadaSelect.appendChild(opt);
        });

        homeJornadaSelect.addEventListener('change', (e) => {
            const selectedId = parseInt(e.target.value);
            const selectedJornada = engine.LIGA_CALENDAR.find(j => j.id === selectedId);
            renderMatches(selectedJornada);
        });
    }

    // 3. Render Matches Function
    function renderMatches(jornada) {
        if (!jornada || !jornada.matches || !matchList) return;
        
        const activeId = activeJornadaGlobal.id;
        const isClosed = jornada.id < activeId;

        matchList.innerHTML = "";
        
        // Update Titles
        document.title = `SPORTS KING QUINIELA | LIGA MX ${jornada.name}`;
        if (jornadaDisplay) jornadaDisplay.textContent = jornada.name;
        
        const regIniciaEl = document.getElementById('reg-inicia');
        const regCierreEl = document.getElementById('reg-cierre');
        if (regIniciaEl) regIniciaEl.textContent = jornada.inicia || "--/--/----";
        if (regCierreEl) regCierreEl.textContent = jornada.cierre || "--/--/----";

        // Registration form visibility
        if (predictionSection) {
            if (isClosed) {
                // Show a banner or just hide the form?
                // Better approach: disable the inputs and show "CLOSED"
                predictionSection.style.opacity = "0.5";
                predictionSection.style.pointerEvents = "none";
                if (finalizeBtn) finalizeBtn.textContent = "REGISTRO CERRADO";
            } else {
                predictionSection.style.opacity = "1";
                predictionSection.style.pointerEvents = "auto";
                if (finalizeBtn) finalizeBtn.textContent = "Finaliza Tu Registro";
            }
        }

        jornada.matches.forEach(match => {
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
                <td><span class="choice-box ${isClosed ? 'disabled' : ''}">L</span></td>
                <td><span class="choice-box ${isClosed ? 'disabled' : ''}">E</span></td>
                <td><span class="choice-box ${isClosed ? 'disabled' : ''}">V</span></td>
            `;
            matchList.appendChild(row);
        });

        // Attach pick listeners (Only if not closed)
        if (!isClosed) {
            document.querySelectorAll('.choice-box').forEach(box => {
                box.addEventListener('click', () => {
                    const row = box.closest('tr');
                    row.querySelectorAll('.choice-box').forEach(b => b.classList.remove('active'));
                    box.classList.add('active');
                    checkStatus();
                });
            });
        }
        
        // Update Home Prize Pool
        updateHomePrizePool(jornada.id);
    }

    async function updateHomePrizePool(jornadaId = null) {
        const results = await engine.fetchData(jornadaId);
        const paidParticipants = results.filter(p => p.status === "PAGADO").length;

        const prizeUsdEl = document.getElementById('home-prize-usd');
        const prizeMxnEl = document.getElementById('home-prize-mxn');

        if (paidParticipants < 1) {
            if (prizeUsdEl) prizeUsdEl.textContent = "TBD";
            if (prizeMxnEl) prizeMxnEl.textContent = "Esperando participantes...";
        } else {
            const prizeUSD = paidParticipants * 10;
            const prizeMXN = prizeUSD * 17.5;
            if (prizeUsdEl) prizeUsdEl.textContent = `$${prizeUSD} USD`;
            if (prizeMxnEl) prizeMxnEl.textContent = `$${prizeMXN.toLocaleString()} MXN`;
        }
    }

    // 2. Initialize Jackpot State
    window.updateJackpotLinks();
    if (sideBetToggle) {
        sideBetToggle.addEventListener('change', window.updateJackpotLinks);
    }

    // --- 3. INITIAL LOAD ---
    renderMatches(activeJornadaGlobal);

    // 4. Unlock Logic
    function checkStatus() {
        const totalPicks = document.querySelectorAll('.choice-box.active').length;
        const matchesComplete = totalPicks === 9;
        
        // Jackpot Validation
        const sideBetActive = sideBetToggle && sideBetToggle.checked;
        const totalGolesInput = document.getElementById('total-goles-pick');
        const goalsValue = totalGolesInput ? totalGolesInput.value.trim() : "";
        const goalsValid = sideBetActive ? (goalsValue !== "" && parseInt(goalsValue) > 0) : true;
        
        const isReady = (paypalDone || zelleDone) && matchesComplete && goalsValid;

        if (finalizeBtn) {
            if (isReady) {
                finalizeBtn.disabled = false;
                finalizeBtn.style.opacity = "1";
                finalizeBtn.style.cursor = "pointer";
                lockMsg.style.color = "var(--primary-neon)";
                lockMsg.textContent = "✓ ¡Listo! Todos los datos están completos.";
            } else {
                finalizeBtn.disabled = true;
                finalizeBtn.style.opacity = "0.5";
                finalizeBtn.style.cursor = "not-allowed";
                
                if (!matchesComplete) {
                    lockMsg.textContent = `⚠ Selecciona todos los partidos (${totalPicks}/9)`;
                    lockMsg.style.color = "var(--secondary-magenta)";
                } else if (!(paypalDone || zelleDone)) {
                    lockMsg.textContent = "⚠ Pendiente: Selecciona y confirma tu pago arriba.";
                    lockMsg.style.color = "var(--accent-yellow)";
                } else if (!goalsValid) {
                    lockMsg.textContent = "⚠ ¡FALTA EL TOTAL DE GOLES DEL JACKPOT!";
                    lockMsg.style.color = "#ffd700";
                    if (totalGolesInput) totalGolesInput.style.borderColor = "red";
                }
            }
        }
    }

    // Listener for goals input to re-validate
    const goalsInput = document.getElementById('total-goles-pick');
    if (goalsInput) {
        goalsInput.addEventListener('input', () => {
            goalsInput.style.borderColor = "#ffd700";
            checkStatus();
        });
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
            const statusEl = document.getElementById('upload-status');
            if (zelleScreenshot.files.length > 0) {
                if (statusEl) {
                    statusEl.textContent = "⌛ PROCESANDO IMAGEN...";
                    statusEl.style.color = "var(--accent-yellow)";
                }
                const reader = new FileReader();
                reader.onload = () => {
                    zelleDone = true;
                    if (statusEl) {
                        statusEl.textContent = "✅ IMAGEN LISTA";
                        statusEl.style.color = "var(--primary-neon)";
                    }
                    checkStatus();
                };
                reader.readAsDataURL(zelleScreenshot.files[0]);
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

            // Handle Payment Proof File (Base64)
            let base64Image = "";
            if (paymentMethod === "ZELLE" && zelleScreenshot.files.length > 0) {
                const file = zelleScreenshot.files[0];
                try {
                    base64Image = await new Promise((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onload = () => resolve(reader.result);
                        reader.onerror = reject;
                        reader.readAsDataURL(file);
                    });
                } catch (err) {
                    console.error("Error reading image:", err);
                }
            }

            const success = await engine.registerParticipant({
                nombre: name,
                telefono: phone,
                predicciones: picks,
                jackpot_goles: sideBetActive ? totalGoles : "NO",
                metodo_pago: paymentMethod,
                status: "PAGADO",
                comprobante_base64: base64Image
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
    if (countdownElement && activeJornadaGlobal) {
        const targetDate = new Date(activeJornadaGlobal.startDate).getTime();
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
