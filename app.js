/**
 * FREEFILM - CINEMATIC UI SCRIPT
 */

const API_BASE = 'https://ophim1.com/v1/api';
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

// --- DOM ELEMENTS ---
const movieGrid = document.getElementById('movieGrid');
const heroGrid = document.getElementById('heroGrid');
const genresScroll = document.getElementById('genresScroll');
const sectionTitle = document.getElementById('sectionTitle');

// Nav & Search Elements
const navPill = document.getElementById('navPill');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');

// --- STATE ---
let currentMode = 'new';
let currentQuery = '';
let isLoading = false;
let isHeroRendered = false; // Chỉ render banner ngang 1 lần khi mới vào web

// ==========================================
// 1. TƯƠNG TÁC GIAO DIỆN (HEADER SEARCH BAR)
// ==========================================

// Mở khung tìm kiếm (chèn lên menu)
searchToggleBtn.onclick = () => {
    navPill.classList.add('searching');
    searchInput.focus();
};

// Đóng khung tìm kiếm
closeSearchBtn.onclick = () => {
    navPill.classList.remove('searching');
    searchInput.value = '';
};

// Thực hiện tìm kiếm khi gõ Enter
searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
            setMode('search', query, `Kết quả tìm kiếm: "${query}"`);
        }
    }
};

// Xử lý click các Menu Chính (Phim Bộ, Phim Lẻ...)
document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
        document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
        item.classList.add('active');
        setMode('category', item.dataset.slug, item.innerText);
    };
});

// ==========================================
// 2. KHỞI TẠO MENU THỂ LOẠI (PILLS)
// ==========================================
// ==========================================
// 2. KHỞI TẠO MENU THỂ LOẠI ĐẦY ĐỦ (PILLS)
// ==========================================
const GENRES = [
    { name: '🔥 Trending', slug: 'phim-moi-cap-nhat' },
    { name: '⚔️ Hành Động', slug: 'hanh-dong' },
    { name: '❤️ Tình Cảm', slug: 'tinh-cam' },
    { name: '😂 Hài Hước', slug: 'hai-huoc' },
    { name: '🌙 Cổ Trang', slug: 'co-trang' },
    { name: '⭐ Tâm Lý', slug: 'tam-ly' },
    { name: '🚓 Hình Sự', slug: 'hinh-su' },
    { name: '🔫 Chiến Tranh', slug: 'chien-tranh' },
    { name: '⚽ Thể Thao', slug: 'the-thao' },
    { name: '🥋 Võ Thuật', slug: 'vo-thuat' },
    { name: '🛸 Viễn Tưởng', slug: 'vien-tuong' },
    { name: '🧭 Phiêu Lưu', slug: 'phieu-luu' },
    { name: '🔬 Khoa Học', slug: 'khoa-hoc' },
    { name: '👻 Kinh Dị', slug: 'kinh-di' },
    { name: '🎵 Âm Nhạc', slug: 'am-nhac' },
    { name: '🐉 Thần Thoại', slug: 'than-thoai' },
    { name: '🎥 Tài Liệu', slug: 'tai-lieu' },
    { name: '👨‍👩‍👧 Gia Đình', slug: 'gia-dinh' },
    { name: '🎭 Chính kịch', slug: 'chinh-kich' },
    { name: '🕵️ Bí ẩn', slug: 'bi-an' },
    { name: '🏫 Học Đường', slug: 'hoc-duong' },
    { name: '🎩 Kinh Điển', slug: 'kinh-dien' },
    { name: '🔞 Phim 18+', slug: 'phim-18' }
];

function initGenres() {
    genresScroll.innerHTML = '';
    GENRES.forEach((genre, index) => {
        const pill = document.createElement('div');
        pill.className = `genre-pill ${index === 0 ? 'active' : ''}`;
        pill.innerText = genre.name;
        pill.onclick = () => {
            document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
            pill.classList.add('active');
            if (genre.slug === 'phim-moi-cap-nhat') setMode('new', '', 'Phim mới cập nhật');
            else setMode('genre', genre.slug, `Thể Loại: ${genre.name.replace(/[^a-zA-ZÀ-ỹ\s]/g, '').trim()}`);
        };
        genresScroll.appendChild(pill);
    });
}
function initGenres() {
    genresScroll.innerHTML = '';
    GENRES.forEach((genre, index) => {
        const pill = document.createElement('div');
        pill.className = `genre-pill ${index === 0 ? 'active' : ''}`;
        pill.innerText = genre.name;
        pill.onclick = () => {
            document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
            pill.classList.add('active');
            if (genre.slug === 'phim-moi-cap-nhat') setMode('new', '', 'Phim mới cập nhật');
            else setMode('genre', genre.slug, `Thể Loại: ${genre.name.replace(/[^a-zA-ZÀ-ỹ\s]/g, '').trim()}`);
        };
        genresScroll.appendChild(pill);
    });
}

function setMode(mode, query, title) {
    if (isLoading) return;
    currentMode = mode;
    currentQuery = query;
    if (title) sectionTitle.innerText = title;
    displayPage(1);
}

// ==========================================
// 3. RENDER GIAO DIỆN PHIM
// ==========================================

// --- Render 2 Banners Ngang To (Hero Section) ---
function renderHero(movies) {
    heroGrid.innerHTML = '';
    if (!movies || movies.length < 2) {
        document.querySelector('.hero-section').style.display = 'none';
        return;
    }
    document.querySelector('.hero-section').style.display = 'block';

    // Bốc ngẫu nhiên 2 phim
    const shuffled = [...movies].sort(() => 0.5 - Math.random());
    const top2 = shuffled.slice(0, 2);

    top2.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;

        // Tạo layout banner ngang
        card.innerHTML = `
            <img src="${movie.full_thumb}" class="hero-bg" alt="${movie.name}">
            <div class="hero-overlay"></div>
            <div class="hero-content">
                <h2 class="hero-title">${movie.name}</h2>
                <button class="btn-play">▶ Xem ngay</button>
            </div>
        `;
        heroGrid.appendChild(card);
    });
}

// --- Render Lưới Phim Chuẩn ---
function renderMoviesGrid(movies) {
    movieGrid.innerHTML = '';
    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = '<p style="color:#aaa; text-align:center; grid-column:1/-1;">Không tìm thấy dữ liệu.</p>';
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;

        let rawScore = (movie.tmdb && movie.tmdb.vote_average) ? parseFloat(movie.tmdb.vote_average) : 0;
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';
        const year = movie.year || new Date().getFullYear();

        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${movie.full_thumb}" class="movie-thumb" alt="${movie.name}">
            </div>
            <h3 class="movie-title">${movie.name}</h3>
            <div class="movie-meta">
                <span class="movie-score">★ ${displayScore}</span>
                <span>${year}</span>
            </div>
        `;
        movieGrid.appendChild(card);
    });
}

// --- Render Phân Trang ---
// --- Render Phân Trang Thông Minh ---
function renderPagination(currentPage, totalPages) {
    const pagDiv = document.getElementById('pagination');
    pagDiv.innerHTML = '';
    
    if (totalPages <= 1) return; // Ẩn phân trang nếu chỉ có 1 trang

    // 1. Nút [⏪] Quay lại
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '⏪';
    prevBtn.disabled = currentPage === 1; // Khóa nếu đang ở trang 1
    prevBtn.onclick = () => displayPage(currentPage - 1);
    pagDiv.appendChild(prevBtn);

    // 2. Thuật toán mảng số trang thông minh
    let pages = [];
    if (totalPages <= 5) {
        // Ít hơn 5 trang: Hiện tất cả (VD: 1 2 3 4 5)
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) {
            // Đang ở những trang đầu: 1 2 3 4 5 ...
            pages = [1, 2, 3, 4, 5, '...'];
        } else if (currentPage >= totalPages - 2) {
            // Đang ở những trang cuối: ... 96 97 98 99 100
            pages = ['...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            // Đang ở khoảng giữa: ... 4 5 6 ...
            pages = ['...', currentPage - 1, currentPage, currentPage + 1, '...'];
        }
    }

    // 3. Đổ mảng ra HTML
    pages.forEach(p => {
        if (p === '...') {
            const dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.innerText = '...';
            pagDiv.appendChild(dots);
        } else {
            const btn = document.createElement('button');
            btn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
            btn.innerText = p;
            btn.onclick = () => { if (p !== currentPage) displayPage(p); };
            pagDiv.appendChild(btn);
        }
    });

    // 4. Nút [⏩] Đi tiếp
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '⏩';
    nextBtn.disabled = currentPage >= totalPages; // Khóa nếu ở trang cuối
    nextBtn.onclick = () => displayPage(currentPage + 1);
    pagDiv.appendChild(nextBtn);
}
// ==========================================
// 4. GỌI API & CHẠY ỨNG DỤNG
// ==========================================
async function displayPage(page) {
    if (isLoading) return;
    isLoading = true;
    
    movieGrid.innerHTML = '<div class="loader-container"><div class="spinner"></div></div>';
    document.getElementById('pagination').innerHTML = '';

    try {
        let apiUrl = '';
        if (currentMode === 'new') apiUrl = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`;
        else if (currentMode === 'category') apiUrl = `${API_BASE}/danh-sach/${currentQuery}?page=${page}`;
        else if (currentMode === 'genre') apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${page}`;
        else if (currentMode === 'search') apiUrl = `${API_BASE}/tim-kiem?keyword=${encodeURIComponent(currentQuery)}&page=${page}`;

        const res = await fetch(apiUrl, fetchOptions);
        const json = await res.json();
        const dataObj = json.data || json;
        const items = dataObj.items || json.items || [];
        
        let totalPages = 1;
        if (dataObj.params && dataObj.params.pagination) {
            totalPages = dataObj.params.pagination.totalPages || 1;
        }

        if (items.length > 0) {
            let imgDomain = (dataObj.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live').replace(/\/$/, ''); 
            const processedItems = items.map(m => {
                let thumb = m.thumb_url || m.poster_url || '';
                if (!thumb.startsWith('http')) {
                    if (!thumb.includes('uploads/movies/')) thumb = '/uploads/movies/' + thumb.replace(/^\//, '');
                    else if (!thumb.startsWith('/')) thumb = '/' + thumb;
                    m.full_thumb = imgDomain + thumb;
                } else m.full_thumb = thumb;
                return m;
            });

            // Chỉ render 2 Banner ngang ngẫu nhiên khi vào trang chủ lần đầu
            if (currentMode === 'new' && page === 1 && !isHeroRendered) {
                renderHero(processedItems);
                isHeroRendered = true; // Đánh dấu đã render
            } else if (currentMode !== 'new') {
                document.querySelector('.hero-section').style.display = 'none'; // Ẩn banner khi search/lọc
            } else {
                document.querySelector('.hero-section').style.display = 'block';
            }

            renderMoviesGrid(processedItems);
            renderPagination(page, totalPages);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            renderMoviesGrid([]);
        }
    } catch (error) { 
        console.error(error); 
        renderMoviesGrid([]); 
    }
    isLoading = false;
}

// KHỞI CHẠY APP
initGenres();
setMode('new', '', 'Phim mới cập nhật');