// assets/js/main.js

document.addEventListener('DOMContentLoaded', () => {
    // Handle Match Choice selection
    const choiceBoxes = document.querySelectorAll('.choice-box');
    choiceBoxes.forEach(box => {
        box.addEventListener('click', () => {
            // Unselect others in the same row
            const row = box.parentElement.parentElement;
            row.querySelectorAll('.choice-box').forEach(b => b.classList.remove('active'));
            // Select this one
            box.classList.add('active');
        });
    });

    // Simple Countdown (Hardcoded for demo, would be dynamic)
    const countdownElement = document.getElementById('countdown');
    if (countdownElement) {
        let totalSeconds = (4 * 24 * 3600) + (12 * 3600) + (44 * 60) + 27;

        function updateCountdown() {
            const days = Math.floor(totalSeconds / (24 * 3600));
            const hours = Math.floor((totalSeconds % (24 * 3600)) / 3600);
            const minutes = Math.floor((totalSeconds % 3600) / 60);
            const seconds = totalSeconds % 60;

            countdownElement.textContent = `${days}d ${hours}h ${minutes}m ${seconds}s`;

            if (totalSeconds > 0) {
                totalSeconds--;
            }
        }

        setInterval(updateCountdown, 1000);
        updateCountdown();
    }

    // Form Submission (Simulate WhatsApp)
    const form = document.getElementById('prediction-form');
    if (form) {
        form.addEventListener('submit', (e) => {
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

            const message = `*SPORTS KING QUINIELA*\n*Nombre:* ${name}\n*Predicciones (J13):* ${choices}\n*Población (Opc.):* ${phone}\n\n_He completado mi registro, aguardo confirmación._`;
            const encodedMessage = encodeURIComponent(message);
            window.open(`https://wa.me/12057671414?text=${encodedMessage}`, '_blank');
        });
    }
});
