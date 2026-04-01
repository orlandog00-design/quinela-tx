// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Handle Match Choice selection
    const choiceBoxes = document.querySelectorAll('.choice-box');
    choiceBoxes.forEach(box => {
        box.addEventListener('click', () => {
            const row = box.parentElement.parentElement;
            row.querySelectorAll('.choice-box').forEach(b => b.classList.remove('active'));
            box.classList.add('active');
        });
    });

    // Simple Countdown
    const countdownElement = document.getElementById('countdown');
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
