// STATE MANAGEMENT
const APP_DATA = {
    workouts: [],
    photos: [],
    settings: {
        apiKey: '',
        username: 'Pejuang Otot',
        startWeight: 0
    }
};

// LOAD DATA ON STARTUP
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    updateUI();
    initChart();
    setupEventListeners();
});

function loadAllData() {
    const savedWorkouts = localStorage.getItem('pt_workouts');
    const savedPhotos = localStorage.getItem('pt_photos');
    const savedSettings = localStorage.getItem('pt_settings');

    if (savedWorkouts) APP_DATA.workouts = JSON.parse(savedWorkouts);
    if (savedPhotos) APP_DATA.photos = JSON.parse(savedPhotos);
    if (savedSettings) APP_DATA.settings = JSON.parse(savedSettings);
}

function saveData() {
    localStorage.setItem('pt_workouts', JSON.stringify(APP_DATA.workouts));
    localStorage.setItem('pt_photos', JSON.stringify(APP_DATA.photos));
    localStorage.setItem('pt_settings', JSON.stringify(APP_DATA.settings));
    updateUI();
}

// NAVIGATION
function navTo(sectionId) {
    // Hide all sections
    document.querySelectorAll('main section').forEach(sec => {
        sec.classList.remove('active-section');
        sec.classList.add('hidden-section');
    });

    // Show target section
    const target = document.getElementById(sectionId);
    target.classList.remove('hidden-section');
    target.classList.add('active-section');

    // Update Nav Icons
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
    // Find the button that calls this function (simple heuristic)
    const navBtn = document.querySelector(`button[onclick="navTo('${sectionId}')"]`);
    if (navBtn) navBtn.classList.add('active');

    // Refresh specific UI elements if needed
    if (sectionId === 'dashboard') {
        updateStats();
        updateChart();
    }
}

// UI UPDATES
function updateUI() {
    // Dashboard
    document.getElementById('user-greeting').textContent = `Halo, ${APP_DATA.settings.username}!`;
    document.getElementById('current-weight').textContent = APP_DATA.settings.startWeight + ' kg'; // Simplification: using start weight for now
    
    // Settings Inputs
    document.getElementById('api-key').value = APP_DATA.settings.apiKey;
    document.getElementById('settings-name').value = APP_DATA.settings.username;
    document.getElementById('settings-weight').value = APP_DATA.settings.startWeight;

    // Lists
    renderWorkoutHistory();
    renderPhotos();
    updateStats();
}

function updateStats() {
    // Count workouts this week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    const weeklyCount = APP_DATA.workouts.filter(w => {
        const wDate = new Date(w.date);
        return wDate >= startOfWeek;
    }).length;

    document.getElementById('weekly-workouts').textContent = weeklyCount;
}

// WORKOUT LOGIC
function setupEventListeners() {
    // Workout Form
    document.getElementById('workout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const newWorkout = {
            id: Date.now(),
            date: new Date().toISOString(),
            name: document.getElementById('exercise-name').value,
            weight: document.getElementById('exercise-weight').value,
            sets: document.getElementById('exercise-sets').value,
            notes: document.getElementById('exercise-notes').value
        };
        
        APP_DATA.workouts.unshift(newWorkout); // Add to top
        saveData();
        e.target.reset();
        alert('Latihan berhasil disimpan!');
        navTo('workout'); // Go to list
    });

    // Settings Save
    document.getElementById('save-settings').addEventListener('click', () => {
        APP_DATA.settings.apiKey = document.getElementById('api-key').value;
        APP_DATA.settings.username = document.getElementById('settings-name').value;
        APP_DATA.settings.startWeight = document.getElementById('settings-weight').value;
        saveData();
        alert('Pengaturan disimpan!');
    });

    // Clear Data
    document.getElementById('clear-data').addEventListener('click', () => {
        if(confirm('Yakin ingin menghapus semua data? Tidak bisa dikembalikan.')) {
            localStorage.clear();
            location.reload();
        }
    });

    // Chat
    document.getElementById('send-btn').addEventListener('click', sendMessage);
    document.getElementById('user-input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Photo Upload
    document.getElementById('upload-btn').addEventListener('click', handlePhotoUpload);
}

function renderWorkoutHistory() {
    const container = document.getElementById('workout-history');
    container.innerHTML = '';

    APP_DATA.workouts.forEach(w => {
        const date = new Date(w.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        const div = document.createElement('div');
        div.className = 'history-item';
        div.innerHTML = `
            <div class="history-date">${date}</div>
            <div class="history-details">
                ${w.name} <br>
                <span style="color: var(--primary-color)">${w.weight}</span> | ${w.sets}
            </div>
            <div style="font-size: 0.9rem; color: #ccc; margin-top: 5px;">"${w.notes}"</div>
        `;
        container.appendChild(div);
    });
}

// AI CHAT LOGIC
async function sendMessage() {
    const input = document.getElementById('user-input');
    const text = input.value.trim();
    if (!text) return;

    // Add User Message
    addMessage(text, 'user-message');
    input.value = '';

    // Show Loading
    const loadingId = addMessage('Sedang berpikir...', 'bot-message');

    // AI Logic
    let responseText = "Maaf, saya butuh API Key untuk menjawab. Silakan isi di menu Pengaturan.";
    
    if (APP_DATA.settings.apiKey) {
        try {
            responseText = await callAIAPI(text);
        } catch (error) {
            responseText = "Error: Gagal menghubungi AI. Cek koneksi atau API Key.";
            console.error(error);
        }
    } else {
        // Mock response for demo if no key
        if (text.toLowerCase().includes('telur')) {
            responseText = "1 butir telur besar rebus mengandung sekitar 78 kalori, 6g protein, dan 5g lemak.";
        } else if (text.toLowerCase().includes('karet merah')) {
            responseText = "Resistance band warna merah biasanya setara dengan beban ringan-sedang, sekitar 5-10 kg tergantung merknya.";
        }
    }

    // Remove loading and show response
    const loadingMsg = document.querySelector(`[data-msg-id="${loadingId}"]`);
    if (loadingMsg) loadingMsg.remove();
    
    addMessage(responseText, 'bot-message');
}

function addMessage(text, className) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    const id = Date.now();
    div.className = `message ${className}`;
    div.textContent = text;
    div.dataset.msgId = id;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
    return id;
}

async function callAIAPI(prompt) {
    // SYSTEM PROMPT
    const systemPrompt = `
        Kamu adalah AI Fitness Coach pribadi.
        Tugasmu:
        1. Menjawab pertanyaan seputar fitness dan nutrisi.
        2. Mengkonversi makanan ke estimasi kalori (Cari data rata-rata).
        3. Mengkonversi alat rumah (botol air, buku, resistance band warna) ke estimasi beban kg.
        4. Memberikan motivasi.
        Jawab dengan singkat, padat, dan suportif. Bahasa Indonesia.
    `;

    // NOTE: This is a generic fetch structure. 
    // User needs to provide the specific endpoint structure later.
    // Assuming OpenAI format for now as a placeholder.
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${APP_DATA.settings.apiKey}`
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo", // Or whatever model they use
            messages: [
                {role: "system", content: systemPrompt},
                {role: "user", content: prompt}
            ]
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    return data.choices[0].message.content;
}

// PHOTO UPLOAD LOGIC (Base64 + Resize)
function handlePhotoUpload() {
    const input = document.getElementById('photo-input');
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const reader = new FileReader();
        
        reader.onload = function(e) {
            const img = new Image();
            img.src = e.target.result;
            
            img.onload = function() {
                // Resize logic to save space
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                const maxWidth = 300; // Thumbnail size
                const scaleSize = maxWidth / img.width;
                canvas.width = maxWidth;
                canvas.height = img.height * scaleSize;

                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
                
                APP_DATA.photos.unshift({
                    id: Date.now(),
                    date: new Date().toISOString(),
                    data: compressedDataUrl
                });
                
                saveData();
                renderPhotos();
                input.value = ''; // Reset input
                alert('Foto berhasil disimpan!');
            }
        }
        
        reader.readAsDataURL(file);
    }
}

function renderPhotos() {
    const container = document.getElementById('photo-grid');
    container.innerHTML = '';
    
    APP_DATA.photos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'photo-item';
        const date = new Date(p.date).toLocaleDateString();
        div.innerHTML = `
            <img src="${p.data}" alt="Progress">
            <div class="photo-date">${date}</div>
        `;
        container.appendChild(div);
    });
}

// CHART LOGIC
let weightChart;

function initChart() {
    const ctx = document.getElementById('weightChart').getContext('2d');
    
    // Mock data generation from workouts (assuming weight is tracked in workouts for now, 
    // or we could add a specific weight tracker. For now, let's just show workout frequency)
    
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Minggu 1', 'Minggu 2', 'Minggu 3', 'Minggu 4'],
            datasets: [{
                label: 'Frekuensi Latihan',
                data: [0, 0, 0, 0], // Placeholder
                borderColor: '#00e676',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                title: { display: true, text: 'Aktivitas Latihan Bulanan', color: '#fff' }
            },
            scales: {
                y: { beginAtZero: true, grid: { color: '#333' }, ticks: { color: '#fff' } },
                x: { grid: { display: false }, ticks: { color: '#fff' } }
            }
        }
    });
}

function updateChart() {
    // Simple logic: Count workouts per week for the last 4 weeks
    // This is a bit complex to do perfectly without a proper calendar library, 
    // so we'll do a simple "Last 7 days, 7-14 days ago, etc" grouping.
    
    if (!weightChart) return;

    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000;
    const counts = [0, 0, 0, 0];

    APP_DATA.workouts.forEach(w => {
        const wDate = new Date(w.date);
        const diffTime = Math.abs(now - wDate);
        const diffWeeks = Math.floor(diffTime / oneWeek);
        
        if (diffWeeks < 4) {
            counts[3 - diffWeeks]++; // 3 is current week, 0 is 4 weeks ago
        }
    });

    weightChart.data.datasets[0].data = counts;
    weightChart.update();
}
