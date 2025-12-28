document.addEventListener('DOMContentLoaded', () => {
    if (window.VANTA) {
        VANTA.NET({
            el: "#vanta-bg",
            mouseControls: true,
            touchControls: true,
            gyroControls: false,
            minHeight: 200.00,
            minWidth: 200.00,
            scale: 1.00,
            scaleMobile: 1.00,
            color: 0x4f46e5,       // Indigo-600
            backgroundColor: 0x09090b, // Zinc-950
            points: 8.00,
            maxDistance: 20.00,
            spacing: 35.00,
            showDots: true
        })
    }
});