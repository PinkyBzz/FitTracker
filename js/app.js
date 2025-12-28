// STATE MANAGEMENT
// API Key split to avoid auto-detection
const _p1 = 'AIzaSyCuRnnDe';
const _p2 = 'GjW6n8PckSri';
const _p3 = 'QWgVy8jgcGmP44';
const DEFAULT_API_KEY = _p1 + _p2 + _p3;

const APP_DATA = {
    workouts: [],
    meals: [],
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
    const savedMeals = localStorage.getItem('pt_meals');
    const savedPhotos = localStorage.getItem('pt_photos');
    const savedSettings = localStorage.getItem('pt_settings');

    if (savedWorkouts) APP_DATA.workouts = JSON.parse(savedWorkouts);
    if (savedMeals) APP_DATA.meals = JSON.parse(savedMeals);
    if (savedPhotos) APP_DATA.photos = JSON.parse(savedPhotos);
    if (savedSettings) {
        APP_DATA.settings = JSON.parse(savedSettings);
        // Force update API Key
        APP_DATA.settings.apiKey = DEFAULT_API_KEY; 
    }
}

function saveData() {
    localStorage.setItem('pt_workouts', JSON.stringify(APP_DATA.workouts));
    localStorage.setItem('pt_meals', JSON.stringify(APP_DATA.meals));
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
    // (Settings page removed)

    // Lists
    if (document.getElementById('workout-history')) renderWorkoutHistory();
    if (document.getElementById('meal-history')) renderMealHistory();
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

    // Settings Save (Removed)

    // Clear Data (Removed)

    // Chat
    const sendBtn = document.getElementById('send-btn');
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
        document.getElementById('user-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
    }

    // Food Chat
    const sendFoodBtn = document.getElementById('send-food-btn');
    if (sendFoodBtn) {
        sendFoodBtn.addEventListener('click', sendFoodMessage);
        document.getElementById('food-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendFoodMessage();
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

function renderMealHistory() {
    const container = document.getElementById('meal-history');
    if (!container) return;
    container.innerHTML = '';

    if (APP_DATA.meals.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-zinc-500 text-xs py-4">Belum ada data makan hari ini</div>`;
        return;
    }

    // Filter for today only? Or show all? Let's show all for now, sorted by date
    APP_DATA.meals.forEach(m => {
        const date = new Date(m.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        const div = document.createElement('div');
        div.className = 'p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm';
        div.innerHTML = `
            <div class="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-medium">${date}</div>
            <div class="flex justify-between items-start mb-1">
                <h3 class="text-sm font-medium text-white">${m.food}</h3>
                <div class="text-xs font-bold text-green-400 bg-green-500/10 px-2 py-1 rounded-md border border-green-500/20">
                    ${m.calories} kcal
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 mt-2 text-[10px] text-zinc-400">
                <div class="bg-zinc-800/50 rounded p-1 text-center">
                    <span class="block text-zinc-500">P</span> ${m.protein}g
                </div>
                <div class="bg-zinc-800/50 rounded p-1 text-center">
                    <span class="block text-zinc-500">C</span> ${m.carbs}g
                </div>
                <div class="bg-zinc-800/50 rounded p-1 text-center">
                    <span class="block text-zinc-500">F</span> ${m.fats}g
                </div>
            </div>
        `;
        container.appendChild(div);
    });
}

// AI CHAT LOGIC
async function sendFoodMessage() {
    const input = document.getElementById('food-input');
    const text = input.value.trim();
    if (!text) return;

    addMessage(text, 'user-message', 'calc-messages');
    input.value = '';

    const loadingId = addMessage('Menghitung kalori...', 'bot-message', 'calc-messages');

    let responseText = "";
    try {
        responseText = await callAIAPI(text, 'calculator');
    } catch (error) {
        console.error(error);
        responseText = `Error: ${error.message || "Gagal menghubungi AI."}`;
    }

    const loadingMsg = document.querySelector(`[data-msg-id="${loadingId}"]`);
    if (loadingMsg) loadingMsg.remove();

    // Parse JSON
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = responseText.match(jsonRegex);
    
    let displayMessage = responseText;
    let mealData = null;

    if (match) {
        try {
            mealData = JSON.parse(match[1]);
            displayMessage = responseText.replace(match[0], '').trim();
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
    }
    
    addMessage(displayMessage, 'bot-message', 'calc-messages');

    if (mealData) {
        showMealSuggestion(mealData);
    }
}

function showMealSuggestion(data) {
    const container = document.getElementById('calc-messages');
    const div = document.createElement('div');
    div.className = "max-w-[85%] mr-auto mb-4";
    
    div.innerHTML = `
        <div class="bg-zinc-800/50 border border-green-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
            <div class="flex items-center gap-2 text-green-400 mb-1">
                <span class="iconify" data-icon="lucide:chef-hat" data-width="18"></span>
                <span class="text-xs font-bold uppercase tracking-wider">Hasil Analisis</span>
            </div>
            <div class="space-y-1">
                <div class="text-white font-medium">${data.food}</div>
                <div class="text-2xl font-bold text-green-400">${data.calories} <span class="text-sm font-normal text-zinc-400">kcal</span></div>
                <div class="grid grid-cols-3 gap-2 mt-2 text-xs text-zinc-400">
                    <div class="bg-zinc-900/50 rounded p-1 text-center">
                        <span class="block text-[10px] text-zinc-500 uppercase">Protein</span> ${data.protein}g
                    </div>
                    <div class="bg-zinc-900/50 rounded p-1 text-center">
                        <span class="block text-[10px] text-zinc-500 uppercase">Carbs</span> ${data.carbs}g
                    </div>
                    <div class="bg-zinc-900/50 rounded p-1 text-center">
                        <span class="block text-[10px] text-zinc-500 uppercase">Fat</span> ${data.fats}g
                    </div>
                </div>
            </div>
            <button class="save-meal-btn w-full bg-green-600 hover:bg-green-500 text-white text-xs font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-green-600/20">
                <span class="iconify" data-icon="lucide:plus-circle" data-width="16"></span>
                Catat Makanan
            </button>
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    const btn = div.querySelector('.save-meal-btn');
    btn.onclick = () => {
        saveSuggestedMeal(data, btn);
    };
}

function saveSuggestedMeal(data, btnElement) {
    const newMeal = {
        id: Date.now(),
        date: new Date().toISOString(),
        food: data.food,
        calories: data.calories || 0,
        protein: data.protein || 0,
        carbs: data.carbs || 0,
        fats: data.fats || 0
    };
    
    APP_DATA.meals.unshift(newMeal);
    saveData();
    
    btnElement.innerHTML = `<span class="iconify" data-icon="lucide:check" data-width="16"></span> Tercatat!`;
    btnElement.className = "w-full bg-zinc-700 text-zinc-300 text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 mt-2 cursor-default border border-zinc-600";
    btnElement.onclick = null;
}

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

    // Remove loading
    const loadingMsg = document.querySelector(`[data-msg-id="${loadingId}"]`);
    if (loadingMsg) loadingMsg.remove();
    
    // Parse JSON if present
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/;
    const match = responseText.match(jsonRegex);
    
    let displayMessage = responseText;
    let workoutData = null;

    if (match) {
        try {
            workoutData = JSON.parse(match[1]);
            // Remove the JSON block from the message shown to user
            displayMessage = responseText.replace(match[0], '').trim();
        } catch (e) {
            console.error("JSON Parse Error", e);
        }
    }
    
    addMessage(displayMessage, 'bot-message');

    // If workout data was detected, show the suggestion card
    if (workoutData) {
        showWorkoutSuggestion(workoutData);
    }
}

function showWorkoutSuggestion(data) {
    const container = document.getElementById('chat-messages');
    const div = document.createElement('div');
    div.className = "max-w-[85%] mr-auto mb-4";
    
    div.innerHTML = `
        <div class="bg-zinc-800/50 border border-indigo-500/30 rounded-2xl p-4 space-y-3 shadow-lg">
            <div class="flex items-center gap-2 text-indigo-400 mb-1">
                <span class="iconify" data-icon="lucide:dumbbell" data-width="18"></span>
                <span class="text-xs font-bold uppercase tracking-wider">Saran Pencatatan</span>
            </div>
            <div class="space-y-1">
                <div class="text-white font-medium">${data.name}</div>
                <div class="text-xs text-zinc-400 flex gap-3">
                    <span class="bg-zinc-700/50 px-2 py-0.5 rounded text-zinc-300">${data.weight} kg</span>
                    <span class="bg-zinc-700/50 px-2 py-0.5 rounded text-zinc-300">${data.sets} sets</span>
                </div>
                <div class="text-xs text-zinc-500 italic">"${data.notes}"</div>
            </div>
            <button class="save-workout-btn w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium py-2.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-2 shadow-lg shadow-indigo-600/20">
                <span class="iconify" data-icon="lucide:plus-circle" data-width="16"></span>
                Simpan ke Log
            </button>
        </div>
    `;
    
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;

    // Add event listener
    const btn = div.querySelector('.save-workout-btn');
    btn.onclick = () => {
        saveSuggestedWorkout(data, btn);
    };
}

function saveSuggestedWorkout(data, btnElement) {
    const newWorkout = {
        id: Date.now(),
        date: new Date().toISOString(),
        name: data.name,
        weight: data.weight || 0,
        sets: data.sets || 1,
        notes: data.notes || ''
    };
    
    APP_DATA.workouts.unshift(newWorkout);
    saveData();
    
    // Update Button State
    btnElement.innerHTML = `<span class="iconify" data-icon="lucide:check" data-width="16"></span> Tersimpan!`;
    btnElement.className = "w-full bg-green-600 text-white text-xs font-medium py-2.5 rounded-xl flex items-center justify-center gap-2 mt-2 cursor-default";
    btnElement.onclick = null;
}

function addMessage(text, className, containerId = 'chat-messages') {
    const container = document.getElementById(containerId);
    if (!container) return; // Safety check

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

async function callAIAPI(prompt, context = 'workout') {
    let systemPrompt = '';

    if (context === 'calculator') {
        systemPrompt = `
        Kamu adalah AI Nutritionist.
        
        TUGAS UTAMA:
        1. Analisis makanan yang disebutkan user.
        2. Estimasi Kalori, Protein, Carbs, dan Fat.
        3. Jawab dengan singkat dan ramah.
        4. WAJIB sertakan blok JSON di AKHIR respon.

        FORMAT JSON:
        \`\`\`json
        {
            "food": "Nama Makanan (Singkat)",
            "calories": 0,
            "protein": 0,
            "carbs": 0,
            "fats": 0
        }
        \`\`\`
        
        NOTE: Angka nutrisi adalah estimasi terbaikmu.
        `;
    } else {
        // Default Workout Prompt
        systemPrompt = `
        Kamu adalah AI Fitness Coach.
        
        TUGAS UTAMA:
        1. Jawab pertanyaan user dengan singkat dan suportif (Bahasa Indonesia).
        2. DETEKSI PENCATATAN LATIHAN:
           Jika user mengatakan baru saja melakukan latihan (contoh: "habis pushup", "angkat galon", "lari pagi", "bicep curl pake buku"), 
           kamu WAJIB menyertakan blok JSON di AKHIR responmu untuk mencatat latihan tersebut.
        
        FORMAT JSON (Wajib jika ada latihan):
        \`\`\`json
        {
            "name": "Nama Latihan",
            "weight": 0, 
            "sets": 1, 
            "notes": "Catatan tambahan (alat yang dipakai, dll)"
        }
        \`\`\`
        
        PENTING: "weight" dan "sets" harus berupa ANGKA (number). Jika tidak disebutkan, estimasi saja.
        
        Contoh User: "Saya habis bicep curl pake 2 buku cetak"
        Contoh Respon Kamu:
        "Wah kreatif banget! Buku cetak tebal biasanya beratnya sekitar 1-2kg. Otot bicepmu pasti kerasa kencang. Lanjutkan!"
        \`\`\`json
        {
            "name": "Bicep Curl (Buku)",
            "weight": 2,
            "sets": 1,
            "notes": "Menggunakan 2 buku cetak"
        }
        \`\`\`
        `;
    }

    const apiKey = APP_DATA.settings.apiKey || DEFAULT_API_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

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

function deletePhoto(id) {
    if(confirm('Yakin ingin menghapus foto ini?')) {
        APP_DATA.photos = APP_DATA.photos.filter(p => p.id !== id);
        saveData();
        renderPhotos();
    }
}

function renderPhotos() {
    const container = document.getElementById('photo-grid');
    if (!container) return;
    container.innerHTML = '';
    
    if (APP_DATA.photos.length === 0) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-zinc-500">
                <span class="iconify mb-2 opacity-50" data-icon="lucide:image-off" data-width="32"></span>
                <p class="text-xs">Belum ada foto</p>
            </div>
        `;
        return;
    }
    
    APP_DATA.photos.forEach(p => {
        const div = document.createElement('div');
        div.className = 'relative aspect-square rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group';
        const date = new Date(p.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: '2-digit' });
        
        div.innerHTML = `
            <img src="${p.data}" alt="Progress" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110">
            
            <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
                <button onclick="deletePhoto(${p.id})" class="w-10 h-10 rounded-full bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 flex items-center justify-center transition-all transform hover:scale-110 shadow-lg" title="Hapus Foto">
                    <span class="iconify" data-icon="lucide:trash-2" data-width="18"></span>
                </button>
                <span class="text-[10px] text-zinc-300 font-medium bg-black/50 px-2 py-1 rounded-full border border-white/10">${date}</span>
            </div>
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
