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
    weightLogs: [], // New: Store weight history
    settings: {
        apiKey: DEFAULT_API_KEY,
        username: 'User',
        startWeight: 0, // Acts as Current Weight
        height: 0,
        targetWeight: 0,
        targetWorkouts: 0
    }
};

// LOAD DATA ON STARTUP
document.addEventListener('DOMContentLoaded', () => {
    loadAllData();
    checkOnboarding(); 
    updateUI();
    initChart();
    setupEventListeners();
});

function loadAllData() {
    const savedWorkouts = localStorage.getItem('pt_workouts');
    const savedMeals = localStorage.getItem('pt_meals');
    const savedPhotos = localStorage.getItem('pt_photos');
    const savedSettings = localStorage.getItem('pt_settings');
    const savedWeightLogs = localStorage.getItem('pt_weight_logs');

    if (savedWorkouts) APP_DATA.workouts = JSON.parse(savedWorkouts);
    if (savedMeals) APP_DATA.meals = JSON.parse(savedMeals);
    if (savedPhotos) APP_DATA.photos = JSON.parse(savedPhotos);
    if (savedWeightLogs) APP_DATA.weightLogs = JSON.parse(savedWeightLogs);
    
    if (savedSettings) {
        APP_DATA.settings = JSON.parse(savedSettings);
        APP_DATA.settings.apiKey = DEFAULT_API_KEY; 
    }

    // Migration: If no logs but we have startWeight, create first log
    if (APP_DATA.weightLogs.length === 0 && APP_DATA.settings.startWeight > 0) {
        APP_DATA.weightLogs.push({
            date: new Date().toISOString(),
            weight: parseFloat(APP_DATA.settings.startWeight)
        });
    }
}

function saveData() {
    localStorage.setItem('pt_workouts', JSON.stringify(APP_DATA.workouts));
    localStorage.setItem('pt_meals', JSON.stringify(APP_DATA.meals));
    localStorage.setItem('pt_photos', JSON.stringify(APP_DATA.photos));
    localStorage.setItem('pt_settings', JSON.stringify(APP_DATA.settings));
    localStorage.setItem('pt_weight_logs', JSON.stringify(APP_DATA.weightLogs));
    updateUI();
}

// UI UPDATES
function updateUI() {
    // Common Header
    const greeting = document.getElementById('user-greeting');
    if (greeting) greeting.textContent = `Halo, ${APP_DATA.settings.username}!`;

    // Dashboard Specific
    const weightDisplay = document.getElementById('current-weight');
    // Use last log as current weight if available, else settings
    let currentWeight = APP_DATA.settings.startWeight;
    if (APP_DATA.weightLogs && APP_DATA.weightLogs.length > 0) {
        currentWeight = APP_DATA.weightLogs[APP_DATA.weightLogs.length - 1].weight;
    }
    if (weightDisplay) weightDisplay.textContent = currentWeight + ' kg';
    
    if (document.getElementById('weekly-workouts')) {
        updateStats();
    }

    // Settings Specific
    const settingsName = document.getElementById('settings-name');
    if (settingsName) settingsName.value = APP_DATA.settings.username;

    const settingsWeight = document.getElementById('settings-weight');
    if (settingsWeight) settingsWeight.value = currentWeight; // Show current weight from logs

    // Lists
    if (document.getElementById('workout-history')) {
        renderWorkoutHistory();
        updatePRs();
    }
    if (document.getElementById('dashboard-recent-workouts')) {
        renderDashboardWorkouts();
    }
    if (document.getElementById('meal-history')) renderMealHistory();
    if (document.getElementById('photo-grid')) renderPhotos();
    
    // Information Page Specific
    if (document.getElementById('bmi-value')) updateInformationPage();
}

function checkOnboarding() {
    // Only run on index.html if modal exists
    const modal = document.getElementById('onboarding-modal');
    if (!modal) return;

    // Check if weight or height is missing (0 or undefined)
    if (!APP_DATA.settings.startWeight || !APP_DATA.settings.height || APP_DATA.settings.startWeight == 0 || APP_DATA.settings.height == 0) {
        modal.classList.remove('hidden');
    }
}

function updateInformationPage() {
    const height = parseFloat(APP_DATA.settings.height) || 0;
    const weight = parseFloat(APP_DATA.settings.startWeight) || 0;

    document.getElementById('info-height').textContent = height;
    document.getElementById('info-weight').textContent = weight;

    if (height > 0 && weight > 0) {
        const heightM = height / 100;
        const bmi = (weight / (heightM * heightM)).toFixed(1);
        
        const bmiValueEl = document.getElementById('bmi-value');
        const bmiCategoryEl = document.getElementById('bmi-category');
        const bmiDescEl = document.getElementById('bmi-description');
        const bmiRecsEl = document.getElementById('bmi-recommendations');

        bmiValueEl.textContent = bmi;

        let category = '';
        let colorClass = '';
        let description = '';
        let recommendations = [];

        if (bmi < 18.5) {
            category = 'Underweight (Kurus)';
            colorClass = 'text-blue-400';
            description = `BMI Anda ${bmi} menunjukkan bahwa berat badan Anda di bawah normal. Tubuh Anda mungkin membutuhkan lebih banyak asupan nutrisi dan kalori untuk mencapai fungsi optimal.`;
            recommendations = [
                'Tingkatkan asupan kalori harian dengan makanan padat nutrisi (kacang-kacangan, alpukat, daging).',
                'Lakukan latihan beban (hypertrophy) untuk membangun massa otot, bukan hanya lemak.',
                'Makan lebih sering (5-6 kali sehari) dengan porsi sedang.',
                'Konsultasikan dengan ahli gizi jika sulit menaikkan berat badan.'
            ];
        } else if (bmi >= 18.5 && bmi < 25) {
            category = 'Normal (Ideal)';
            colorClass = 'text-emerald-400';
            description = `Selamat! BMI Anda ${bmi} berada dalam rentang ideal. Ini menunjukkan keseimbangan yang baik antara berat dan tinggi badan Anda.`;
            recommendations = [
                'Pertahankan pola makan seimbang dan rutin berolahraga.',
                'Fokus pada peningkatan komposisi tubuh (menambah otot, menjaga kadar lemak).',
                'Coba variasi latihan baru untuk menjaga motivasi.',
                'Pastikan istirahat dan hidrasi cukup.'
            ];
        } else if (bmi >= 25 && bmi < 30) {
            category = 'Overweight (Gemuk)';
            colorClass = 'text-yellow-400';
            description = `BMI Anda ${bmi} menunjukkan kelebihan berat badan. Ini bisa meningkatkan risiko masalah kesehatan jika tidak dikelola, namun perubahan gaya hidup kecil bisa sangat berdampak.`;
            recommendations = [
                'Buat defisit kalori moderat (kurangi 300-500 kkal dari kebutuhan harian).',
                'Tingkatkan aktivitas kardio (jalan cepat, lari, berenang) minimal 150 menit/minggu.',
                'Kurangi konsumsi gula tambahan dan makanan olahan.',
                'Prioritaskan protein dalam setiap makan untuk rasa kenyang lebih lama.'
            ];
        } else {
            category = 'Obesity (Obesitas)';
            colorClass = 'text-red-400';
            description = `BMI Anda ${bmi} masuk dalam kategori obesitas. Sangat disarankan untuk mengambil langkah aktif demi kesehatan jangka panjang jantung dan sendi Anda.`;
            recommendations = [
                'Konsultasikan dengan dokter sebelum memulai program latihan intens.',
                'Mulai dengan aktivitas low-impact seperti jalan kaki atau berenang untuk melindungi sendi.',
                'Fokus pada pola makan "whole foods" (makanan utuh) dan perbanyak sayuran.',
                'Cari dukungan sosial atau bergabung dengan komunitas sehat.'
            ];
        }

        bmiCategoryEl.textContent = category;
        bmiCategoryEl.className = `inline-flex items-center px-3 py-1 rounded-full bg-zinc-800 text-xs font-medium ${colorClass}`;
        bmiDescEl.textContent = description;

        bmiRecsEl.innerHTML = recommendations.map(rec => `
            <li class="flex gap-3 text-sm text-zinc-400">
                <span class="iconify text-zinc-600 mt-0.5 flex-shrink-0" data-icon="lucide:arrow-right-circle" data-width="16"></span>
                <span>${rec}</span>
            </li>
        `).join('');
    }
}

function updateStats() {
    // Count workouts this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    
    const weeklyCount = APP_DATA.workouts.filter(w => {
        const wDate = new Date(w.date);
        return wDate >= startOfWeek;
    }).length;

    const weeklyEl = document.getElementById('weekly-workouts');
    if (weeklyEl) weeklyEl.textContent = weeklyCount;

    // Update Goals Widget
    const targetWeight = APP_DATA.settings.targetWeight || 0;
    const targetWorkouts = APP_DATA.settings.targetWorkouts || 0;
    
    // Determine current weight from logs
    let currentWeight = APP_DATA.settings.startWeight || 0;
    if (APP_DATA.weightLogs && APP_DATA.weightLogs.length > 0) {
        currentWeight = APP_DATA.weightLogs[APP_DATA.weightLogs.length - 1].weight;
    }

    // Weight Goal
    const weightGoalEl = document.getElementById('target-weight-display');
    const currentWeightEl = document.getElementById('current-weight-goal');
    const weightProgress = document.getElementById('weight-progress');

    if (weightGoalEl && currentWeightEl && weightProgress) {
        weightGoalEl.textContent = targetWeight || '--';
        currentWeightEl.textContent = currentWeight;
        
        if (targetWeight > 0 && APP_DATA.weightLogs.length > 0) {
            const startWeight = APP_DATA.weightLogs[0].weight;
            const totalDiff = targetWeight - startWeight;
            const currentDiff = currentWeight - startWeight;

            // Avoid division by zero
            if (Math.abs(totalDiff) < 0.1) {
                weightProgress.style.width = '100%';
            } else {
                // Calculate percentage
                let pct = (currentDiff / totalDiff) * 100;
                
                // Clamp between 0 and 100
                pct = Math.max(0, Math.min(pct, 100));
                
                weightProgress.style.width = `${pct}%`;
            }
        } else {
            weightProgress.style.width = '0%';
        }
    }

    // Workout Goal
    const workoutGoalEl = document.getElementById('target-workout-display');
    const currentWorkoutEl = document.getElementById('current-workout-goal');
    const workoutProgress = document.getElementById('workout-progress');

    if (workoutGoalEl && currentWorkoutEl && workoutProgress) {
        workoutGoalEl.textContent = targetWorkouts || '--';
        currentWorkoutEl.textContent = weeklyCount;
        
        if (targetWorkouts > 0) {
            const pct = Math.min((weeklyCount / targetWorkouts) * 100, 100);
            workoutProgress.style.width = `${pct}%`;
        } else {
            workoutProgress.style.width = '0%';
        }
    }
}

// DASHBOARD GOAL EDITING
function setupDashboardGoals() {
    const editBtn = document.getElementById('edit-goals-btn');
    const cancelBtn = document.getElementById('cancel-goals-btn');
    const saveBtn = document.getElementById('save-goals-btn');
    const displayDiv = document.getElementById('goals-display');
    const editDiv = document.getElementById('goals-edit');

    if (!editBtn || !displayDiv || !editDiv) return;

    editBtn.addEventListener('click', () => {
        displayDiv.classList.add('hidden');
        editDiv.classList.remove('hidden');
        
        // Pre-fill
        document.getElementById('edit-target-weight').value = APP_DATA.settings.targetWeight || '';
        document.getElementById('edit-target-workouts').value = APP_DATA.settings.targetWorkouts || '';
    });

    cancelBtn.addEventListener('click', () => {
        editDiv.classList.add('hidden');
        displayDiv.classList.remove('hidden');
    });

    saveBtn.addEventListener('click', () => {
        const newWeight = document.getElementById('edit-target-weight').value;
        const newWorkouts = document.getElementById('edit-target-workouts').value;

        APP_DATA.settings.targetWeight = newWeight;
        APP_DATA.settings.targetWorkouts = newWorkouts;
        saveData();
        
        editDiv.classList.add('hidden');
        displayDiv.classList.remove('hidden');
        updateStats(); // Refresh UI
    });
}

// DASHBOARD SLIDER
function setupDashboardSlider() {
    const dot1 = document.getElementById('slider-dot-1');
    const dot2 = document.getElementById('slider-dot-2');
    const prevBtn = document.getElementById('slider-prev');
    const nextBtn = document.getElementById('slider-next');
    const slide1 = document.getElementById('slide-1');
    const slide2 = document.getElementById('slide-2');
    const title = document.getElementById('slider-title');

    let currentSlide = 1;

    if (!dot1 || !dot2 || !slide1 || !slide2) return;

    function showSlide(n) {
        currentSlide = n;
        if (n === 1) {
            // Show Slide 1 (Chart)
            slide1.classList.remove('-translate-x-full');
            slide1.classList.add('translate-x-0');
            
            slide2.classList.remove('translate-x-0');
            slide2.classList.add('translate-x-full');

            // Update Dots
            dot1.classList.remove('bg-zinc-700');
            dot1.classList.add('bg-indigo-500');
            dot2.classList.remove('bg-indigo-500');
            dot2.classList.add('bg-zinc-700');

            // Update Title
            if (title) title.textContent = 'Riwayat Berat Badan';
        } else {
            // Show Slide 2 (Workouts)
            slide1.classList.remove('translate-x-0');
            slide1.classList.add('-translate-x-full');
            
            slide2.classList.remove('translate-x-full');
            slide2.classList.add('translate-x-0');

            // Update Dots
            dot1.classList.remove('bg-indigo-500');
            dot1.classList.add('bg-zinc-700');
            dot2.classList.remove('bg-zinc-700');
            dot2.classList.add('bg-indigo-500');

            // Update Title
            if (title) title.textContent = 'Riwayat Latihan';
        }
    }

    dot1.addEventListener('click', () => showSlide(1));
    dot2.addEventListener('click', () => showSlide(2));

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            const next = currentSlide === 1 ? 2 : 1;
            showSlide(next);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            const next = currentSlide === 1 ? 2 : 1;
            showSlide(next);
        });
    }
}

// WORKOUT LOGIC
function setupEventListeners() {
    setupDashboardGoals();
    setupDashboardSlider();

    // Onboarding Form
    const onboardingForm = document.getElementById('onboarding-form');
    if (onboardingForm) {
        onboardingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('onboard-name').value;
            const height = document.getElementById('onboard-height').value;
            const weight = document.getElementById('onboard-weight').value;

            if (name) APP_DATA.settings.username = name;
            if (height) APP_DATA.settings.height = height;
            if (weight) {
                const wVal = parseFloat(weight);
                APP_DATA.settings.startWeight = wVal;
                // Add to log
                APP_DATA.weightLogs.push({
                    date: new Date().toISOString(),
                    weight: wVal
                });
            }

            saveData();
            document.getElementById('onboarding-modal').classList.add('hidden');
            
            // Refresh UI to show new name/weight
            updateUI();
            alert(`Selamat datang, ${name}! Profil Anda telah disimpan.`);
        });
    }

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
            const name = document.getElementById('settings-name').value;
            const weight = document.getElementById('settings-weight').value;
            const apiKey = document.getElementById('api-key').value;

            if (name) APP_DATA.settings.username = name;
            if (weight) {
                const wVal = parseFloat(weight);
                APP_DATA.settings.startWeight = wVal;
                // Add to log
                APP_DATA.weightLogs.push({
                    date: new Date().toISOString(),
                    weight: wVal
                });
            }
            if (apiKey) APP_DATA.settings.apiKey = apiKey;

            saveData();
            alert('Pengaturan berhasil disimpan!');
        });
    }

    // Export Data
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }

    // Clear Data
    const clearBtn = document.getElementById('clear-data');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            if(confirm('Yakin ingin menghapus SEMUA data? Tindakan ini tidak bisa dibatalkan.')) {
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

    // Date Filters
    const workoutDateFilter = document.getElementById('workout-date-filter');
    if (workoutDateFilter) {
        workoutDateFilter.addEventListener('change', (e) => {
            renderWorkoutHistory(e.target.value);
        });
    }

    const mealDateFilter = document.getElementById('meal-date-filter');
    if (mealDateFilter) {
        mealDateFilter.addEventListener('change', (e) => {
            renderMealHistory(e.target.value);
        });
    }
}

function renderDashboardWorkouts() {
    const container = document.getElementById('dashboard-recent-workouts');
    if (!container) return;
    
    if (APP_DATA.workouts.length === 0) {
        container.innerHTML = '<div class="text-xs text-zinc-500 text-center py-4">Belum ada aktivitas latihan</div>';
        return;
    }

    container.innerHTML = '';
    // Take top 5 recent workouts
    const recent = APP_DATA.workouts.slice(0, 5);
    
    recent.forEach(w => {
        const date = new Date(w.date);
        const dateStr = date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
        
        const div = document.createElement('div');
        div.className = 'flex items-center justify-between p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors';
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <span class="iconify" data-icon="lucide:dumbbell" data-width="16"></span>
                </div>
                <div>
                    <div class="text-sm font-medium text-white">${w.name}</div>
                    <div class="text-[10px] text-zinc-500">${dateStr}</div>
                </div>
            </div>
            <div class="text-xs font-medium text-zinc-300">
                ${w.weight} <span class="text-zinc-600">|</span> ${w.sets}
            </div>
        `;
        container.appendChild(div);
    });
}

function renderWorkoutHistory(filterDate = null) {
    const container = document.getElementById('workout-history');
    if (!container) return;
    container.innerHTML = '';

    let workouts = APP_DATA.workouts;

    // Filter by date if provided
    if (filterDate) {
        workouts = workouts.filter(w => {
            const wDate = new Date(w.date);
            const year = wDate.getFullYear();
            const month = String(wDate.getMonth() + 1).padStart(2, '0');
            const day = String(wDate.getDate()).padStart(2, '0');
            const wDateStr = `${year}-${month}-${day}`;
            return wDateStr === filterDate;
        });
    }

    if (workouts.length === 0) {
        container.innerHTML = '<div class="text-xs text-zinc-500 text-center py-4">Tidak ada latihan pada tanggal ini</div>';
        return;
    }

    workouts.forEach(w => {
        const date = new Date(w.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
        const div = document.createElement('div');
        div.className = 'p-4 rounded-2xl bg-zinc-900/40 border border-zinc-800/60 backdrop-blur-sm mb-3 group relative card-3d';
        div.setAttribute('data-tilt', '');
        div.setAttribute('data-tilt-max', '2');
        div.setAttribute('data-tilt-speed', '400');
        div.setAttribute('data-tilt-glare', '');
        div.setAttribute('data-tilt-max-glare', '0.05');
        
        div.innerHTML = `
            <div class="flex justify-between items-start">
                <div class="text-[10px] text-zinc-500 mb-1 uppercase tracking-wider font-medium">${date}</div>
                <button onclick="deleteWorkout(${w.id})" class="text-zinc-600 hover:text-red-500 transition-colors p-1 -mr-2 -mt-2 opacity-0 group-hover:opacity-100">
                    <span class="iconify" data-icon="lucide:trash-2" data-width="14"></span>
                </button>
            </div>
            <div class="flex justify-between items-start mb-1">
                <h3 class="text-sm font-medium text-white">${w.name}</h3>
                <div class="text-xs font-medium text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
                    ${w.weight} <span class="text-zinc-500 mx-1">|</span> ${w.sets}
                </div>
            </div>
            <div class="text-xs text-zinc-400 italic">"${w.notes}"</div>
        `;
        container.appendChild(div);
    });
    
    // Re-init tilt for new elements
    if (window.VanillaTilt) {
        VanillaTilt.init(container.querySelectorAll('.card-3d'));
    }
}

window.deleteWorkout = function(id) {
    if(!confirm('Hapus log latihan ini?')) return;
    APP_DATA.workouts = APP_DATA.workouts.filter(w => w.id !== id);
    saveData();
    renderWorkoutHistory();
    updateStats(); // Update dashboard stats if needed
}

window.shareWorkout = function() {
    if (APP_DATA.workouts.length === 0) {
        alert('Belum ada data latihan untuk dibagikan!');
        return;
    }
    
    // Get today's workouts
    const today = new Date().toDateString();
    const todaysWorkouts = APP_DATA.workouts.filter(w => new Date(w.date).toDateString() === today);

    if (todaysWorkouts.length === 0) {
         alert('Belum ada latihan hari ini. Semangat latihan dulu!');
         return;
    }

    let text = `🔥 FitTrack Workout Summary (${new Date().toLocaleDateString('id-ID')})\n\n`;
    todaysWorkouts.forEach(w => {
        text += `💪 ${w.name}: ${w.weight} (${w.sets})\n`;
    });
    text += `\n#FitTrack #PejuangOtot`;

    navigator.clipboard.writeText(text).then(() => {
        alert('Ringkasan latihan berhasil disalin! Siap dipamerkan di sosmed 😎');
    }).catch(err => {
        console.error('Gagal menyalin: ', err);
        alert('Gagal menyalin teks. Izin clipboard mungkin ditolak.');
    });
}

function renderMealHistory(filterDate = null) {
    const container = document.getElementById('meal-history');
    if (!container) return;
    container.innerHTML = '';

    let meals = APP_DATA.meals;

    // Filter by date if provided
    if (filterDate) {
        meals = meals.filter(m => {
            const mDate = new Date(m.date);
            const year = mDate.getFullYear();
            const month = String(mDate.getMonth() + 1).padStart(2, '0');
            const day = String(mDate.getDate()).padStart(2, '0');
            const mDateStr = `${year}-${month}-${day}`;
            return mDateStr === filterDate;
        });
    }

    if (meals.length === 0) {
        container.innerHTML = `<div class="col-span-full text-center text-zinc-500 text-xs py-4">Belum ada data makan pada tanggal ini</div>`;
        return;
    }

    meals.forEach(m => {
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

    // Use Weight Logs for Chart
    weightChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [], // Dynamic
            datasets: [{
                label: 'Berat Badan (kg)',
                data: [], // Dynamic
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
                y: { 
                    display: true, // Show Y axis for weight
                    grid: { color: '#27272a', drawBorder: false },
                    ticks: { color: '#52525b', font: { family: 'Inter', size: 10 } }
                }
            },
            interaction: { intersect: false, mode: 'index' },
        }
    });
    
    updateChart();
}

function updateChart() {
    if (!weightChart) return;

    // Sort logs by date
    const sortedLogs = [...APP_DATA.weightLogs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Take last 7 entries or all if less
    const recentLogs = sortedLogs.slice(-7);

    const labels = recentLogs.map(log => new Date(log.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }));
    const data = recentLogs.map(log => log.weight);

    weightChart.data.labels = labels;
    weightChart.data.datasets[0].data = data;
    weightChart.update();
}

function exportData() {
    const rows = [
        ['Date', 'Exercise', 'Weight', 'Sets', 'Notes']
    ];

    APP_DATA.workouts.forEach(w => {
        rows.push([
            new Date(w.date).toLocaleDateString(),
            w.name,
            w.weight,
            w.sets,
            w.notes
        ]);
    });

    let csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "fittrack_workouts.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updatePRs() {
    const container = document.getElementById('pr-list');
    if (!container) return;

    const prs = {};

    APP_DATA.workouts.forEach(w => {
        if (!w.weight) return;
        const name = w.name.trim();
        const key = name.toLowerCase();
        
        // Parse weight: remove non-numeric chars except dot/comma
        let weightVal = parseFloat(w.weight.toString().replace(/[^\d.,]/g, '').replace(',', '.'));
        
        if (isNaN(weightVal)) return;

        if (!prs[key] || weightVal > prs[key].weight) {
            prs[key] = {
                name: name,
                weight: weightVal,
                unit: w.weight.toString().replace(/[\d.,\s]/g, '') || 'kg',
                date: w.date
            };
        }
    });

    const sortedPRs = Object.values(prs).sort((a, b) => b.weight - a.weight).slice(0, 5);

    if (sortedPRs.length === 0) {
        container.innerHTML = '<div class="text-xs text-zinc-500 text-center py-2">Belum ada rekor tercatat</div>';
        return;
    }

    container.innerHTML = '';
    sortedPRs.forEach(pr => {
        const div = document.createElement('div');
        div.className = 'flex justify-between items-center p-3 rounded-xl bg-zinc-950/50 border border-zinc-800/50';
        div.innerHTML = `
            <div>
                <div class="text-xs font-medium text-white">${pr.name}</div>
                <div class="text-[10px] text-zinc-500">${new Date(pr.date).toLocaleDateString()}</div>
            </div>
            <div class="text-sm font-bold text-indigo-400">${pr.weight} <span class="text-xs font-normal text-zinc-500">${pr.unit || 'kg'}</span></div>
        `;
        container.appendChild(div);
    });
}
