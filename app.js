// User data (dalam aplikasi nyata, ini akan disimpan di database)
const users = [
  { username: 'admin', password: 'admin123', role: 'admin', name: 'Administrator' },
  { username: 'juri1', password: 'juri123', role: 'juri', name: 'Juri 1' },
  { username: 'juri2', password: 'juri123', role: 'juri', name: 'Juri 2' },
  { username: 'user1', password: 'user123', role: 'user', name: 'User 1' },
  { username: 'user2', password: 'user123', role: 'user', name: 'User 2' }
];

let currentUser = null;
let dataNilai = [];

// Load data from localStorage
function loadData() {
  const savedData = localStorage.getItem('penilaianData');
  if (savedData) {
    dataNilai = JSON.parse(savedData);
  }
}

// Save data to localStorage
function saveData() {
  localStorage.setItem('penilaianData', JSON.stringify(dataNilai));
}

// Check if user is logged in
function checkAuth() {
  const savedUser = localStorage.getItem('currentUser');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    showMainContent();
  } else {
    showLoginForm();
  }
}

// Login function
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  const user = users.find(u => u.username === username && u.password === password);
  
  if (user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    showMainContent();
    showNotification(`Selamat datang, ${user.name}!`, 'success');
  } else {
    showNotification('Username atau password salah!', 'error');
  }
}

// Logout function
function logout() {
  currentUser = null;
  localStorage.removeItem('currentUser');
  showLoginForm();
  showNotification('Berhasil logout!', 'success');
}

// Show login form
function showLoginForm() {
  document.getElementById('login-section').classList.remove('hidden');
  document.getElementById('main-section').classList.add('hidden');
}

// Show main content
function showMainContent() {
  document.getElementById('login-section').classList.add('hidden');
  document.getElementById('main-section').classList.remove('hidden');
  updateUserInfo();
  loadData();
  updateStats();
  updateRecentScores();
  if (dataNilai.length > 0) {
    tampilkanChart();
  }
  updateUIForRole();
}

// Update user info display
function updateUserInfo() {
  const userInfo = document.getElementById('user-info');
  const roleClass = `role-${currentUser.role}`;
  userInfo.innerHTML = `
    <div class="flex items-center space-x-3">
      <div class="text-right">
        <div class="font-semibold text-white">${currentUser.name}</div>
        <span class="role-badge ${roleClass}">${currentUser.role}</span>
      </div>
      <button onclick="logout()" class="btn-danger text-sm px-3 py-1">
        <i class="fas fa-sign-out-alt mr-1"></i>Logout
      </button>
    </div>
  `;
}

// Clear all data (admin only)
function clearAllData() {
  if (currentUser.role !== 'admin') {
    showNotification('Anda tidak memiliki akses untuk menghapus data!', 'error');
    return;
  }
  
  if (confirm('Apakah Anda yakin ingin menghapus semua data? Tindakan ini tidak dapat dibatalkan!')) {
    dataNilai = [];
    localStorage.removeItem('penilaianData');
    updateStats();
    updateRecentScores();
    tampilkanChart();
    showNotification('Semua data berhasil dihapus!', 'success');
  }
}

function updateLabel(id) {
  const slider = document.getElementById(id);
  const label = document.getElementById(`label-${id}`);
  label.textContent = slider.value;
  
  label.classList.add('pulse-animation');
  setTimeout(() => {
    label.classList.remove('pulse-animation');
  }, 200);
}

function updateStats() {
  if (dataNilai.length === 0) {
    document.getElementById('total-peserta').textContent = '0';
    document.getElementById('rata-rata-total').textContent = '0.00';
    document.getElementById('nilai-tertinggi').textContent = '0.00';
    return;
  }
  
  const totalPeserta = dataNilai.length;
  const rataRataTotal = (dataNilai.reduce((sum, item) => sum + parseFloat(item.rataRata), 0) / totalPeserta).toFixed(2);
  const nilaiTertinggi = Math.max(...dataNilai.map(item => parseFloat(item.rataRata))).toFixed(2);
  
  document.getElementById('total-peserta').textContent = totalPeserta;
  document.getElementById('rata-rata-total').textContent = rataRataTotal;
  document.getElementById('nilai-tertinggi').textContent = nilaiTertinggi;
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `fixed top-4 right-4 p-4 rounded-lg text-white z-50 transition-all duration-300 ${
    type === 'success' ? 'bg-green-500' : 'bg-red-600'
  }`;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function updateRecentScores() {
  const container = document.getElementById('recent-scores');
  if (dataNilai.length === 0) {
    container.innerHTML = '<p class="text-gray-500 text-center">Belum ada data nilai</p>';
    return;
  }
  
  const recentScores = dataNilai.slice(-5).reverse();
  container.innerHTML = recentScores.map(score => `
    <div class="score-card">
      <div class="flex justify-between items-center">
        <div>
          <h3 class="font-bold text-lg">${score.nama}</h3>
          <p class="text-gray-600">Kreativitas: ${score.kreativitas} | rasa: ${score.rasa} | Kerjasama: ${score.kerjasama}</p>
        </div>
        <div class="text-right">
          <div class="text-2xl font-bold gradient-text">${score.rataRata}</div>
          <div class="text-sm text-gray-500">Rata-rata</div>
        </div>
      </div>
    </div>
  `).join('');
}

function tampilkanChart() {
  const ctx = document.getElementById('chart-nilai').getContext('2d');
  if (window.chartInst) window.chartInst.destroy();

  const labels = dataNilai.map(x => x.nama);
  const data = dataNilai.map(x => x.rataRata);

  // Fungsi untuk mendapatkan warna berdasarkan nilai (merah ke hijau)
  function getColor(value) {
    const normalizedValue = value / 10; // Normalize to 0-1
    const red = Math.round(220 * (1 - normalizedValue)); // 220 to 0
    const green = Math.round(38 + (217 * normalizedValue)); // 38 to 255
    return `rgba(${red}, ${green}, 38, 0.8)`;
  }

  window.chartInst = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Rata-rata Nilai',
        data,
        backgroundColor: data.map(value => getColor(value)),
        borderColor: data.map(value => getColor(value).replace('0.8', '1')),
        borderWidth: 2,
        borderRadius: 8,
        borderSkipped: false,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: {
            font: {
              size: 14,
              weight: 'bold'
            },
            color: '#1F2937'
          }
        }
      },
      scales: {
        y: { 
          beginAtZero: true, 
          max: 10,
          grid: {
            color: 'rgba(0,0,0,0.1)'
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#1F2937'
          }
        },
        x: {
          grid: {
            display: false
          },
          ticks: {
            font: {
              size: 12
            },
            color: '#1F2937'
          }
        }
      }
    }
  });
}

function exportToExcel() {
  if (dataNilai.length === 0) {
    showNotification('Tidak ada data untuk diexport!', 'error');
    return;
  }
  
  const ws_data = [
    ["Nama", "Kreativitas", "rasa", "Kerjasama", "Rata-rata"]
  ];
  dataNilai.forEach(x => {
    ws_data.push([x.nama, x.kreativitas, x.rasa, x.kerjasama, x.rataRata]);
  });
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(ws_data);
  XLSX.utils.book_append_sheet(wb, ws, "Penilaian");
  XLSX.writeFile(wb, "penilaian_lomba.xlsx");
  
  showNotification('Data berhasil diexport ke Excel!', 'success');
}

// Show/hide elements based on user role
function updateUIForRole() {
  const formSection = document.getElementById('form-section');
  const adminControls = document.getElementById('admin-controls');
  
  if (currentUser.role === 'user') {
    formSection.classList.add('hidden');
  } else {
    formSection.classList.remove('hidden');
  }
  
  if (currentUser.role === 'admin') {
    adminControls.classList.remove('hidden');
  } else {
    adminControls.classList.add('hidden');
  }
}

window.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  
  // Login form submit
  document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    login();
  });

  // Main form submit
  document.getElementById('form-penilaian').addEventListener('submit', function(e) {
    e.preventDefault();

    if (currentUser.role === 'user') {
      showNotification('User hanya dapat melihat data!', 'error');
      return;
    }

    const nama = document.getElementById('namaPeserta').value;
    const kreativitas = parseInt(document.getElementById('kreativitas').value);
    const rasa = parseInt(document.getElementById('rasa').value);
    const kerjasama = parseInt(document.getElementById('kerjasama').value);

    const rataRata = ((kreativitas + rasa + kerjasama) / 3).toFixed(2);

    dataNilai.push({ nama, kreativitas, rasa, kerjasama, rataRata });
    saveData();
    tampilkanChart();
    updateStats();
    updateRecentScores();

    this.reset();
    updateLabel('kreativitas');
    updateLabel('rasa');
    updateLabel('kerjasama');
    
    showNotification('Nilai berhasil disimpan!', 'success');
  });
}); 