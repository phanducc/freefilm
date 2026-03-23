// ========================================================
// APP.JS - XỬ LÝ DỮ LIỆU PHIM (API NGUONC)
// ========================================================

const API_BASE = 'https://phim.nguonc.com/api/films';

// --- 1. DANH MỤC PHIM (Menu Trái Tim - Chỉ để Phim Bộ & Phim Lẻ) ---
const CATEGORIES = [
    { name: 'Phim Bộ', slug: 'phim-bo' },
    { name: 'Phim Lẻ', slug: 'phim-le' }
];

// --- 2. THỂ LOẠI PHIM (Menu Ngôi Sao) ---
const GENRES = [
    { name: 'Hành Động', slug: 'hanh-dong' }, { name: 'Phiêu Lưu', slug: 'phieu-luu' },
    { name: 'Hoạt Hình', slug: 'hoat-hinh' }, { name: 'Hài', slug: 'hai' },
    { name: 'Hình Sự', slug: 'hinh-su' }, { name: 'Tài Liệu', slug: 'tai-lieu' },
    { name: 'Chính Kịch', slug: 'chinh-kich' }, { name: 'Gia Đình', slug: 'gia-dinh' },
    { name: 'Giả Tưởng', slug: 'gia-tuong' }, { name: 'Lịch Sử', slug: 'lich-su' },
    { name: 'Kinh Dị', slug: 'kinh-di' }, { name: 'Nhạc', slug: 'nhac' },
    { name: 'Bí Ẩn', slug: 'bi-an' }, { name: 'Lãng Mạn', slug: 'lang-man' },
    { name: 'Viễn Tưởng', slug: 'khoa-hoc-vien-tuong' }, { name: 'Gây Cấn', slug: 'gay-can' },
    { name: 'Chiến Tranh', slug: 'chien-tranh' }, { name: 'Tâm Lý', slug: 'tam-ly' },
    { name: 'Tình Cảm', slug: 'tinh-cam' }, { name: 'Cổ Trang', slug: 'co-trang' },
    { name: 'Miền Tây', slug: 'mien-tay' }, { name: 'Phim 18+', slug: 'phim-18' }
];

// --- CÁC BIẾN GIAO DIỆN (DOM) ---
const movieGrid = document.getElementById('movie-grid');
const pageTitle = document.getElementById('page-title');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

const navHome = document.getElementById('navHome');
const navCategory = document.getElementById('navCategory');
const navGenre = document.getElementById('navGenre');

const categoryModal = document.getElementById('categoryModal');
const genreModal = document.getElementById('genreModal');
const categoryContainer = document.getElementById('categoryContainer');
const genreContainer = document.getElementById('genreContainer');

// --- TRẠNG THÁI HỆ THỐNG ---
let currentMode = 'new'; // 'new', 'search', 'genre', 'category'
let currentQuery = '';   
let allCachedMovies = [];
let currentLocalPage = 1;
const MOVIES_PER_PAGE = 10; 
let apiPageToFetch = 1;

// 1. Tạo các nút trong 2 Bảng Menu
function initMenus() {
    // Menu Trái Tim (Danh mục: Chỉ có Phim Bộ & Phim Lẻ)
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('div');
        btn.className = 'genre-btn';
        btn.innerText = cat.name;
        btn.onclick = () => {
            document.querySelectorAll('#categoryContainer .genre-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setMode('category', cat.slug, `Danh Mục: ${cat.name}`);
        };
        categoryContainer.appendChild(btn);
    });

    // Menu Ngôi Sao (Thể loại)
    GENRES.forEach(genre => {
        const btn = document.createElement('div');
        btn.className = 'genre-btn';
        btn.innerText = genre.name;
        btn.onclick = () => {
            document.querySelectorAll('#genreContainer .genre-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            setMode('genre', genre.slug, `Thể Loại: ${genre.name}`);
        };
        genreContainer.appendChild(btn);
    });
}

// 2. Chuyển đổi trạng thái (Đóng menu & Tải lại phim)
function setMode(mode, query, title) {
    currentMode = mode;
    currentQuery = query;
    pageTitle.innerText = title;
    
    // Đóng cả 2 bảng menu
    categoryModal.classList.add('hidden');
    genreModal.classList.add('hidden'); 
    
    // Đổi màu thanh Dock
    navHome.classList.toggle('active', mode === 'new' || mode === 'search');
    navCategory.classList.toggle('active', mode === 'category');
    navGenre.classList.toggle('active', mode === 'genre');

    allCachedMovies = [];
    currentLocalPage = 1;
    apiPageToFetch = 1;
    displayLocalPage(1);
}

// 3. Render Thẻ Phim
function renderMovies(movies, startIndex) {
    movieGrid.innerHTML = '';
    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding: 50px; color: #888;">Không tìm thấy dữ liệu phim.</p>';
        return;
    }

    movies.forEach((movie, index) => {
        const rankNum = startIndex + index + 1;
        
        // --- NHẬN DIỆN PHIM BỘ / PHIM LẺ (Ô MÀU CAM) ---
        let movieType = 'Phim Lẻ';
        const currentEp = (movie.episode_current || '').toLowerCase();
        if (currentEp.includes('tập') || parseInt(movie.total_episodes) > 1) {
            movieType = 'Phim Bộ';
        }
        
        const quality = movie.quality || 'HD'; // Ô Màu Tím

        const card = document.createElement('div');
        card.className = 'ff-card';
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        
        card.innerHTML = `
            <div class="ff-card-header">
                <span class="ff-rank">#${rankNum}</span>
                <h3 class="ff-title" title="${movie.name}">${movie.name}</h3>
            </div>
            
            <img src="${movie.thumb_url || movie.poster_url}" class="ff-thumb" alt="${movie.name}">
            
            <div class="ff-tags">
                <span class="tag-status">${movieType}</span>
                <span class="tag-quality">${quality}</span>
            </div>
            
            <div class="ff-card-footer">
                <div class="blue-underline"></div>
            </div>
        `;
        movieGrid.appendChild(card);
    });
}

// 4. Lấy dữ liệu API
async function fetchAndCacheMovies(apiPage) {
    try {
        movieGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#aaa; padding: 50px;">Đang tải dữ liệu...</p>';
        let apiUrl = '';

        if (currentMode === 'new') {
            apiUrl = `${API_BASE}/phim-moi-cap-nhat?page=${apiPage}`;
        } else if (currentMode === 'category') { 
            apiUrl = `${API_BASE}/danh-sach/${currentQuery}?page=${apiPage}`; 
        } else if (currentMode === 'genre') { 
            apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${apiPage}`; 
        } else if (currentMode === 'search') { 
            apiUrl = `${API_BASE}/search?keyword=${currentQuery}`; 
        }

        const res = await fetch(apiUrl);
        const data = await res.json();

        if (data && data.items) {
            allCachedMovies = [...allCachedMovies, ...data.items];
            return data.paginate || { total_page: 1 };
        }
    } catch (error) {
        console.error("Lỗi API:", error);
    }
    return null;
}

// 5. Phân trang
async function displayLocalPage(page) {
    const startIndex = (page - 1) * MOVIES_PER_PAGE;
    const endIndex = startIndex + MOVIES_PER_PAGE;

    if (endIndex > allCachedMovies.length) {
        const paginate = await fetchAndCacheMovies(apiPageToFetch);
        if (paginate) {
            if (apiPageToFetch < paginate.total_page) apiPageToFetch++;
        } else {
            return;
        }
    }

    const moviesToDisplay = allCachedMovies.slice(startIndex, endIndex);
    renderMovies(moviesToDisplay, startIndex);

    currentLocalPage = page;
    pageInfo.innerText = `Trang ${currentLocalPage}`;
    prevBtn.disabled = currentLocalPage === 1;
    nextBtn.disabled = (endIndex >= allCachedMovies.length && moviesToDisplay.length < MOVIES_PER_PAGE);
}

// --- BẮT SỰ KIỆN NÚT BẤM DOCK ---

navHome.addEventListener('click', () => {
    setMode('new', '', 'Phim Mới Cập Nhật');
});

// Bấm Trái Tim ❤️ (Bật/Tắt Danh Mục)
navCategory.addEventListener('click', () => {
    categoryModal.classList.toggle('hidden');
    genreModal.classList.add('hidden'); // Tự động đóng Ngôi sao nếu đang mở
    
    navCategory.classList.toggle('active');
    navGenre.classList.remove('active');
    navHome.classList.remove('active');
});

// Bấm Ngôi Sao ⭐ (Bật/Tắt Thể Loại)
navGenre.addEventListener('click', () => {
    genreModal.classList.toggle('hidden');
    categoryModal.classList.add('hidden'); // Tự động đóng Trái tim nếu đang mở
    
    navGenre.classList.toggle('active');
    navCategory.classList.remove('active');
    navHome.classList.remove('active');
});

// Chuyển trang & Tìm kiếm
prevBtn.addEventListener('click', () => {
    if (currentLocalPage > 1) { displayLocalPage(currentLocalPage - 1); document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' }); }
});
nextBtn.addEventListener('click', () => {
    displayLocalPage(currentLocalPage + 1); document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
});

searchBtn.addEventListener('click', () => {
    const keyword = searchInput.value.trim();
    if (keyword) setMode('search', keyword, `Kết quả tìm kiếm: "${keyword}"`);
});
searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') searchBtn.click(); });

// Chạy lần đầu
initMenus();
displayLocalPage(1);