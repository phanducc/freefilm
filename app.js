// ========================================================
// APP.JS - XỬ LÝ DỮ LIỆU PHIM (API OPHIM1.COM)
// ========================================================

const API_BASE = 'https://ophim1.com/v1/api';

// --- 1. DANH MỤC PHIM (Menu Trái Tim) ---
const CATEGORIES = [
    { name: 'Phim Bộ', slug: 'phim-bo' },
    { name: 'Phim Lẻ', slug: 'phim-le' },
    { name: 'TV Shows', slug: 'tv-shows' },
    { name: 'Hoạt Hình', slug: 'hoat-hinh' }
];

// --- 2. THỂ LOẠI PHIM (Menu Ngôi Sao - Đã cập nhật chuẩn danh sách) ---
const GENRES = [
    { name: 'Short Drama', slug: 'short-drama' }, { name: 'Hành Động', slug: 'hanh-dong' },
    { name: 'Tình Cảm', slug: 'tinh-cam' }, { name: 'Hài Hước', slug: 'hai-huoc' },
    { name: 'Cổ Trang', slug: 'co-trang' }, { name: 'Tâm Lý', slug: 'tam-ly' },
    { name: 'Hình Sự', slug: 'hinh-su' }, { name: 'Chiến Tranh', slug: 'chien-tranh' },
    { name: 'Thể Thao', slug: 'the-thao' }, { name: 'Võ Thuật', slug: 'vo-thuat' },
    { name: 'Viễn Tưởng', slug: 'vien-tuong' }, { name: 'Phiêu Lưu', slug: 'phieu-luu' },
    { name: 'Khoa Học', slug: 'khoa-hoc' }, { name: 'Kinh Dị', slug: 'kinh-di' },
    { name: 'Âm Nhạc', slug: 'am-nhac' }, { name: 'Thần Thoại', slug: 'than-thoai' },
    { name: 'Tài Liệu', slug: 'tai-lieu' }, { name: 'Gia Đình', slug: 'gia-dinh' },
    { name: 'Chính kịch', slug: 'chinh-kich' }, { name: 'Bí ẩn', slug: 'bi-an' },
    { name: 'Học Đường', slug: 'hoc-duong' }, { name: 'Kinh Điển', slug: 'kinh-dien' },
    { name: 'Phim 18+', slug: 'phim-18' }
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
let currentMode = 'new'; 
let currentQuery = '';   
let allCachedMovies = [];
let currentLocalPage = 1;
const MOVIES_PER_PAGE = 10; 
let apiPageToFetch = 1;

// 1. Tạo các nút trong 2 Bảng Menu
function initMenus() {
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

// 2. Chuyển đổi trạng thái
function setMode(mode, query, title) {
    currentMode = mode;
    currentQuery = query;
    pageTitle.innerText = title;
    
    categoryModal.classList.add('hidden');
    genreModal.classList.add('hidden'); 
    
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
        
        let movieType = 'Phim Lẻ';
        if (movie.type === 'series' || movie.type === 'hoathinh' || movie.type === 'tvshows') {
            movieType = 'Phim Bộ';
        }
        
        const quality = movie.quality || 'HD'; 

        const card = document.createElement('div');
        card.className = 'ff-card';
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        
        card.innerHTML = `
            <div class="ff-card-header">
                <span class="ff-rank">#${rankNum}</span>
                <h3 class="ff-title" title="${movie.name}">${movie.name}</h3>
            </div>
            <img src="${movie.full_thumb}" class="ff-thumb" alt="${movie.name}">
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

// 4. Lấy dữ liệu API từ Ophim
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

async function fetchAndCacheMovies(apiPage) {
    try {
        movieGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#aaa; padding: 50px;">Đang tải dữ liệu...</p>';
        let apiUrl = '';

        if (currentMode === 'new') {
            apiUrl = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${apiPage}`;
        } else if (currentMode === 'category') { 
            apiUrl = `${API_BASE}/danh-sach/${currentQuery}?page=${apiPage}`; 
        } else if (currentMode === 'genre') { 
            apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${apiPage}`; 
        } else if (currentMode === 'search') { 
            apiUrl = `${API_BASE}/tim-kiem?keyword=${currentQuery}&page=${apiPage}`; 
        }

        const res = await fetch(apiUrl, fetchOptions);
        const data = await res.json();

        if (data && data.status === "success" && data.data && data.data.items) {
            // Ophim nối domain ảnh với tên file ảnh
            const imgDomain = data.data.APP_DOMAIN_CDN_IMAGE || '';
            const processedItems = data.data.items.map(m => {
                m.full_thumb = (m.thumb_url && m.thumb_url.startsWith('http')) ? m.thumb_url : imgDomain + '/' + m.thumb_url;
                return m;
            });

            allCachedMovies = [...allCachedMovies, ...processedItems];
            return data.data.params.pagination || { totalPages: 1 };
        }
    } catch (error) {
        console.error("Lỗi API Ophim:", error);
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
            if (apiPageToFetch < paginate.totalPages) apiPageToFetch++;
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
navHome.addEventListener('click', () => { setMode('new', '', 'Phim Mới Cập Nhật'); });

navCategory.addEventListener('click', () => {
    categoryModal.classList.toggle('hidden');
    genreModal.classList.add('hidden');
    navCategory.classList.toggle('active');
    navGenre.classList.remove('active');
    navHome.classList.remove('active');
});

navGenre.addEventListener('click', () => {
    genreModal.classList.toggle('hidden');
    categoryModal.classList.add('hidden');
    navGenre.classList.toggle('active');
    navCategory.classList.remove('active');
    navHome.classList.remove('active');
});

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

initMenus();
displayLocalPage(1);