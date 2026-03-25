/**
 * ============================================================================
 * TÊN DỰ ÁN   : FREEFILM WEB APP
 * PHIÊN BẢN   : v0.0.1 (Release)
 * MÔ TẢ       : Xử lý logic API, render giao diện Trang chủ, Sidebar và Phân trang.
 * ============================================================================
 */

// ============================================================================
// PHẦN 1: CẤU HÌNH & BIẾN TOÀN CỤC (CONFIG & STATE)
// ============================================================================

const API_BASE = 'https://ophim1.com/v1/api';
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

// --- Dữ liệu tĩnh (Static Data) ---
const CATEGORIES = [
    { name: 'Phim Bộ', slug: 'phim-bo' }, { name: 'Phim Lẻ', slug: 'phim-le' },
    { name: 'TV Shows', slug: 'tv-shows' }, { name: 'Hoạt Hình', slug: 'hoat-hinh' }
];

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

// --- Các phần tử DOM (DOM Elements) ---
const movieGrid = document.getElementById('movie-grid');
const topMoviesList = document.getElementById('topMoviesList');
const pageTitle = document.getElementById('page-title');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

// --- Quản lý trạng thái (State Management) ---
let currentMode = 'new';    // Chế độ hiện tại: 'new', 'category', 'genre', 'search'
let currentQuery = '';      // Giá trị tìm kiếm hoặc slug thể loại
let isLoading = false;      // Cờ chống spam click API


// ============================================================================
// PHẦN 2: TIỆN ÍCH & KHỞI TẠO (UTILITIES & INIT)
// ============================================================================

/**
 * Hàm tiện ích: Tạo thẻ HTML nhanh và an toàn
 */
function createNode(tag, className, innerText) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerText) el.innerText = innerText;
    return el;
}

/**
 * Khởi tạo Menu Thể loại chính (Header) và Thể loại phụ (Sidebar phải)
 */
function initMenus() {
    const topNav = document.getElementById('topNavCategories');
    const rightGenres = document.getElementById('genreContainer');

    // Render 4 Thể loại chính lên Header
    CATEGORIES.forEach(cat => {
        const btn = createNode('span', 'cat-link', cat.name);
        btn.onclick = () => { 
            // Xóa trạng thái active của toàn bộ menu
            document.querySelectorAll('.cat-link, .genre-pill').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active'); 
            setMode('category', cat.slug, cat.name); 
        };
        if (topNav) topNav.appendChild(btn);
    });

    // Render các Thể loại con dạng Pill (viên thuốc) vào Cột phải
    GENRES.forEach(genre => {
        const btn = createNode('div', 'genre-pill', genre.name);
        btn.onclick = () => { 
            document.querySelectorAll('.genre-pill, .cat-link').forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); 
            setMode('genre', genre.slug, `Thể Loại: ${genre.name}`); 
        };
        if (rightGenres) rightGenres.appendChild(btn);
    });
}

/**
 * Chuyển đổi chế độ xem (Ví dụ: Đang từ phim mới chuyển sang tìm kiếm)
 */
function setMode(mode, query, title) {
    if (isLoading) return; // Ngăn người dùng bấm liên tục gây lỗi
    
    currentMode = mode; 
    currentQuery = query; 
    pageTitle.innerText = title;
    
    // Xử lý hiệu ứng sáng (active) cho nút Home trên thanh Dock trái
    const navHome = document.getElementById('navHome');
    if (navHome) {
        navHome.classList.toggle('active', mode === 'new' || mode === 'search');
    }
    
    // Reset về trang 1 mỗi khi đổi chế độ
    displayPage(1); 
}


// ============================================================================
// PHẦN 3: XUẤT GIAO DIỆN LÊN MÀN HÌNH (UI RENDERING)
// ============================================================================

/**
 * Render Lưới phim chính ở giữa màn hình (Hiển thị tối đa 24 phim/trang)
 */
function renderMovies(movies, page) {
    movieGrid.innerHTML = '';
    
    // Xử lý Fallback: Nếu không có dữ liệu
    if (!movies || movies.length === 0) {
        movieGrid.appendChild(createNode('p', '', 'Không tìm thấy phim nào.')).style = "grid-column:1/-1; text-align:center; padding: 50px; color: #888;"; 
        return;
    }
    
    // Tính toán số thứ tự phim (Ví dụ: Trang 2 bắt đầu từ #25)
    const startIndex = (page - 1) * 24;

    movies.forEach((movie, index) => {
        // Phân loại Phim Bộ / Phim Lẻ chuẩn theo API
        const type = (movie.type === 'series') ? 'Phim Bộ' : 'Phim Lẻ';
        
        const card = createNode('div', 'ff-card');
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        
        // Header Card (Rank + Tiêu đề)
        const header = createNode('div', 'ff-card-header');
        header.appendChild(createNode('span', 'ff-rank', `#${startIndex + index + 1}`));
        const titleEl = createNode('h3', 'ff-title', movie.name);
        titleEl.title = movie.name;
        header.appendChild(titleEl);

        // Ảnh Thumbnail
        const img = document.createElement('img');
        img.src = movie.full_thumb; 
        img.className = 'ff-thumb'; 
        img.alt = movie.name;

        // Footer Card (Trạng thái + Điểm TMDB)
        const tags = createNode('div', 'ff-tags');
        tags.appendChild(createNode('span', 'tag-status', type));
        
        // Xử lý hiển thị điểm TMDB (Lọc điểm 0.0 thành N/A)
        let rawScore = (movie.tmdb && movie.tmdb.vote_average) ? parseFloat(movie.tmdb.vote_average) : 0;
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';
        tags.appendChild(createNode('span', 'tag-tmdb', `★ ${displayScore}`));

        // Thanh gạch chân màu xanh (Trang trí)
        const footer = createNode('div', 'ff-card-footer');
        footer.appendChild(createNode('div', 'blue-underline'));

        // Gắn vào DOM
        card.append(header, img, tags, footer);
        movieGrid.appendChild(card);
    });
}

/**
 * Render Top 2 phim mới nhất vào cột bên phải
 */
function renderTopMovies(movies) {
    if (!topMoviesList) return;
    topMoviesList.innerHTML = '';
    
    // Cắt mảng lấy đúng 2 phần tử đầu tiên
    const top2 = movies.slice(0, 2); 
    
    top2.forEach(movie => {
        const card = createNode('div', 'top-card');
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        
        const img = document.createElement('img');
        img.src = movie.full_thumb; 
        
        const overlay = createNode('div', 'top-card-overlay');
        const title = createNode('h4', 'top-card-title', movie.name);
        const info = createNode('div', 'top-card-info');
        
        // Xử lý hiển thị điểm
        let rawScore = (movie.tmdb && movie.tmdb.vote_average) ? parseFloat(movie.tmdb.vote_average) : 0;
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';
        
        info.innerHTML = `<span>▶ Xem ngay</span> <span>⭐ ${displayScore}</span>`;

        overlay.append(title, info);
        card.append(img, overlay);
        topMoviesList.appendChild(card);
    });
}

/**
 * Thuật toán Phân trang thông minh (Chống tràn số trang bằng dấu ...)
 */
function renderPagination(currentPage, totalPages) {
    const pagDiv = document.getElementById('pagination');
    pagDiv.innerHTML = '';

    // Ẩn thanh phân trang nếu chỉ có 1 trang
    if (totalPages <= 1) return;

    // Nút [⏪] Quay lại trang trước
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '⏪';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { displayPage(currentPage - 1); };
    pagDiv.appendChild(prevBtn);

    // Xây dựng mảng hiển thị các số trang
    let pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) {
            pages = [1, 2, 3, 4, 5, '...'];
        } else if (currentPage >= totalPages - 2) {
            pages = ['...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = ['...', currentPage - 1, currentPage, currentPage + 1, '...'];
        }
    }

    // Render mảng số trang ra giao diện
    pages.forEach(p => {
        if (p === '...') {
            const dots = createNode('span', 'page-dots', '...');
            pagDiv.appendChild(dots);
        } else {
            const btn = createNode('button', `page-btn ${p === currentPage ? 'active' : ''}`, p);
            btn.onclick = () => { if (p !== currentPage) displayPage(p); };
            pagDiv.appendChild(btn);
        }
    });

    // Nút [⏩] Đi tới trang sau
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '⏩';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => { displayPage(currentPage + 1); };
    pagDiv.appendChild(nextBtn);
}


// ============================================================================
// PHẦN 4: GIAO TIẾP API & XỬ LÝ LOGIC LÕI (CORE DATA LOGIC)
// ============================================================================

/**
 * Hàm Lõi: Lấy dữ liệu từ API dựa trên Trạng thái (Mode) và hiển thị
 */
async function displayPage(page) {
    if (isLoading) return;
    isLoading = true;
    
    // Reset Grid & Hiển thị Spinner Load data
    movieGrid.innerHTML = '';
    document.getElementById('pagination').innerHTML = ''; 
    const loader = createNode('div', 'loader-container');
    loader.appendChild(createNode('div', 'spinner'));
    loader.style.display = 'flex';
    movieGrid.appendChild(loader);

    try {
        // Xây dựng URL động dựa trên Mode
        let apiUrl = '';
        if (currentMode === 'new') apiUrl = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`;
        else if (currentMode === 'category') apiUrl = `${API_BASE}/danh-sach/${currentQuery}?page=${page}`;
        else if (currentMode === 'genre') apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${page}`;
        else if (currentMode === 'search') apiUrl = `${API_BASE}/tim-kiem?keyword=${encodeURIComponent(currentQuery)}&page=${page}`;

        // Gọi API Ophim
        const res = await fetch(apiUrl, fetchOptions); 
        const json = await res.json();
        
        // Chuẩn hóa dữ liệu trả về (Khắc phục sự không đồng nhất cấu trúc API)
        const dataObj = json.data || json; 
        const items = dataObj.items || json.items || [];
        
        // --- XỬ LÝ LỖI SỐ TRANG (TOTAL PAGES) ---
        let totalPages = 1;
        if (dataObj.params && dataObj.params.pagination) {
            const p = dataObj.params.pagination;
            totalPages = p.totalPages || Math.ceil(p.totalItems / p.totalItemsPerPage) || 1;
        }
        
        // Cứu cánh: Nếu API lỗi mất số trang tổng, tự tính toán dựa trên độ dài mảng
        if (totalPages === 1) {
            if (items.length === 24) totalPages = page + 1; // Đủ 24 phim -> Mở trang sau
            else totalPages = page; // Ít hơn 24 -> Chốt chặn
        }

        // --- XỬ LÝ HÌNH ẢNH LỖI ĐƯỜNG DẪN (IMAGE CDN FORMATTING) ---
        if (items.length > 0) {
            let imgDomain = (dataObj.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live').replace(/\/$/, ''); 
            
            const processedItems = items.map(m => {
                let thumb = m.thumb_url || m.poster_url || '';
                if (!thumb.startsWith('http')) {
                    if (!thumb.includes('uploads/movies/')) thumb = '/uploads/movies/' + thumb.replace(/^\//, '');
                    else if (!thumb.startsWith('/')) thumb = '/' + thumb;
                    m.full_thumb = imgDomain + thumb;
                } else { 
                    m.full_thumb = thumb; 
                }
                return m;
            });
            
            // Đẩy dữ liệu vào các hàm render
            renderMovies(processedItems, page);
            renderTopMovies(processedItems);
            renderPagination(page, totalPages);
            
            // Tự động cuộn lên đầu Grid khi tải xong trang mới
            document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            renderMovies([], page);
        }
    } catch (error) { 
        console.error("Lỗi API FreeFilm:", error); 
        renderMovies([], page); 
    }
    
    // Mở khóa cờ Load
    isLoading = false;
}


// ============================================================================
// PHẦN 5: BẮT SỰ KIỆN & CHẠY ỨNG DỤNG (EVENTS & BOOTSTRAP)
// ============================================================================

// Nút Trang Chủ trên Sidebar
document.getElementById('navHome').onclick = () => {
    document.querySelectorAll('.cat-link, .genre-pill').forEach(b => b.classList.remove('active')); 
    setMode('new', '', 'Phim Mới Cập Nhật');
};

// Nút Tìm Kiếm trên Header
document.getElementById('searchBtn').onclick = () => { 
    if (searchInput.value.trim()) {
        document.querySelectorAll('.cat-link, .genre-pill').forEach(b => b.classList.remove('active')); 
        setMode('search', searchInput.value.trim(), `Kết quả tìm kiếm: "${searchInput.value.trim()}"`);
    }
};

// Tính năng nhấn Enter để Tìm kiếm
searchInput.onkeypress = (e) => { 
    if (e.key === 'Enter') document.getElementById('searchBtn').click(); 
};

// Khởi chạy App: Khởi tạo Menu và tải trang mặc định (Phim mới nhất)
initMenus();
setMode('new', '', 'Phim Mới Cập Nhật');