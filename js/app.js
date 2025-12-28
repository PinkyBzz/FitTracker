// STATE MANAGEMENT
const DEFAULT_API_KEY = 'AIzaSyDdRrOAg3rOuca7EAuoD1Fzfpe1E8HMpB8';

const APP_DATA = {
    workouts: [],
    photos: [],
    settings: {
        apiKey: DEFAULT_API_KEY,
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

// UI UPDATES
function updateUI() {
    // Common Header
    const greeting = document.getElementById('user-greeting');
    if (greeting) greeting.textContent = `Halo, ${APP_DATA.settings.username}!`;

    // Dashboard Specific
    const weightDisplay = document.getElementById('current-weight');
    if (weightDisplay) weightDisplay.textContent = APP_DATA.settings.startWeight + ' kg';
    
    if (document.getElementById('weekly-workouts')) {
        updateStats();
    }

    // Settings Specific
    if (document.getElementById('api-key')) {
        document.getElementById('api-key').value = APP_DATA.settings.apiKey || '';
        document.getElementById('settings-name').value = APP_DATA.settings.username;
        document.getElementById('settings-weight').value = APP_DATA.settings.startWeight;
    }

    // Lists
    if (document.getElementById('workout-history')) renderWorkoutHistory();
    if (document.getElementById('photo-grid')) renderPhotos();
}

function updateStats() {
    // Count workouts this week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    
    const weeklyCount = APP_DATA.workouts.filter(w => {
        const wDate = new Date(w.date);
        return wDate >= startOfWeek;
    }).length;

    const weeklyEl = document.getElementById('weekly-workouts');
    if (weeklyEl) weeklyEl.textContent = weeklyCount;
}

// WORKOUT LOGIC
function setupEventListeners() {
    // Workout Form
    const workoutForm = document.getElementById('workout-form');
    if (workoutForm) {
        workoutForm.addEventListener('submit', (e) => {
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
            window.location.href = 'workout.html'; // Reload/Stay on list
        });
    }

    // Settings Save
    const saveSettingsBtn = document.getElementById('save-settings');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', () => {
            const newKey = document.getElementById('api-key').value.trim();
            if (newKey) APP_DATA.settings.apiKey = newKey;
            
            APP_DATA.settings.username = document.getElementById('settings-name').value;
            APP_DATA.settings.startWeight = document.getElementById('settings-weight').value;
            saveData();
            alert('Pengaturan disimpan!');
        });
    }

    // Clear Data
    const clearDataBtn = document.getElementById('clear-data');
    if (clearDataBtn) {
        clearDataBtn.addEventListener('click', () => {
            if(confirm('Yakin ingin menghapus semua data? Tidak bisa dikembalikan.')) {
                localStorage.clear();
                location.reload();
            }
        });
    }

    // Chat
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
        document.getElementById('user-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Photo Upload
    const uploadBtn = document.getElementById('upload-btn');
    if (uploadBtn) {
        uploadBtn.addEventListener('click', handlePhotoUpload);
    }
}

function renderWorkoutHistory() {
    const container = document.getElementById('workout-history');
    if (!container) return;
    container.innerHTML = '';

    APP_DATA.workouts.forEach(w => {
        const date = new Date(w.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        const div = document.createElement('div');
        div.className = 'p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm mb-3';
        div.innerHTML = `
            <div class="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-medium">${date}</div>
            <div class="flex justify-between items-start mb-1">
                <h3 class="text-sm font-medium text-white">${w.name}</h3>
                <div class="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                    ${w.weight}kg <span class="text-zinc-500 mx-1">|</span> ${w.sets} set
                </div>
            </div>
            <div class="text-xs text-zinc-400 italic">"${w.notes}"</div>
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
    let responseText = "";
    
    try {
        responseText = await callAIAPI(text);
    } catch (error) {
        console.error(error);
        responseText = `Error: ${error.message || "Gagal menghubungi AI."}`;
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
    
    // Tailwind classes based on type
    const baseClasses = "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed mb-4";
    const userClasses = "bg-indigo-600 text-white ml-auto rounded-br-none shadow-lg shadow-indigo-600/10";
    const botClasses = "bg-zinc-800 text-zinc-200 mr-auto rounded-bl-none border border-zinc-700";
    
    div.className = `${baseClasses} ${className === 'user-message' ? userClasses : botClasses}`;
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

    const apiKey = APP_DATA.settings.apiKey || DEFAULT_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: systemPrompt + "\n\nUser Question: " + prompt
                }]
            }]
        })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error.message);
    // Gemini response structure
    return data.candidates[0].content.parts[0].text;
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
    if (!container) return;
    container.innerHTML = '';
    
    APP_DATA.photos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group';
        const date = new Date(p.date).toLocaleDateString();
        div.innerHTML = `
            <img src="${p.data}" alt="Progress" class="w-full h-full object-cover">
            <div class="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/80 to-transparent p-2 text-[10px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">${date}</div>
        `;
        container.appendChild(div);
    });
}

// CHART LOGIC
let weightChart;

function initChart() {
    const ctxEl = document.getElementById('weightChart');
    if (!ctxEl) return; // Only run if chart canvas exists
    const ctx = ctxEl.getContext('2d');

    // Gradient
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(99, 102, 241, 0.2)'); // Indigo
    gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

    // Mock data generation from workouts
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [{
                label: 'Frekuensi Latihan',
                data: [0, 0, 0, 0, 0, 0, 0], // Placeholder
                borderColor: '#6366f1', // Indigo 500
                backgroundColor: gradient,
                borderWidth: 2,
                pointBackgroundColor: '#09090b',
                pointBorderColor: '#6366f1',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4, // Smooth curve
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: '#18181b',
                    titleColor: '#a1a1aa',
                    bodyColor: '#fff',
                    borderColor: '#27272a',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    titleFont: { family: 'Inter', size: 10 },
                    bodyFont: { family: 'Inter', size: 12, weight: '500' }
                }
            },
            scales: {
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: '#52525b', font: { family: 'Inter', size: 10 } }
                },
                y: { display: false }
            },
            interaction: { intersect: false, mode: 'index' },
        }
    });
    
    updateChart();
}

function updateChart() {
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
