// ========================================================
// APP.JS - PHÂN TRANG NHẢY SỐ (1:1 VỚI API)
// ========================================================

const API_BASE = 'https://ophim1.com/v1/api';

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

const movieGrid = document.getElementById('movie-grid');
const topMoviesList = document.getElementById('topMoviesList');
const pageTitle = document.getElementById('page-title');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');

let currentMode = 'new', currentQuery = '';
let isLoading = false;
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

// Tạo Node an toàn
function createNode(tag, className, innerText) {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (innerText) el.innerText = innerText;
    return el;
}

function initMenus() {
    const topNav = document.getElementById('topNavCategories');
    const rightGenres = document.getElementById('genreContainer');

    // 4 Thể loại chính lên Header
    CATEGORIES.forEach(cat => {
        const btn = createNode('span', 'cat-link', cat.name);
        btn.onclick = () => { 
            document.querySelectorAll('.cat-link, .genre-pill').forEach(b => b.classList.remove('active')); 
            btn.classList.add('active'); 
            setMode('category', cat.slug, cat.name); 
        };
        if(topNav) topNav.appendChild(btn);
    });

    // Các thể loại con vào Bảng bên phải
    GENRES.forEach(genre => {
        const btn = createNode('div', 'genre-pill', genre.name);
        btn.onclick = () => { 
            document.querySelectorAll('.genre-pill, .cat-link').forEach(b => b.classList.remove('active'));
            btn.classList.add('active'); 
            setMode('genre', genre.slug, `Thể Loại: ${genre.name}`); 
        };
        if(rightGenres) rightGenres.appendChild(btn);
    });
}

function setMode(mode, query, title) {
    if (isLoading) return;
    currentMode = mode; currentQuery = query; pageTitle.innerText = title;
    
    // Chỉ giữ lại hiệu ứng sáng nút Home trên thanh Dock
    const navHome = document.getElementById('navHome');
    if (navHome) {
        navHome.classList.toggle('active', mode === 'new' || mode === 'search');
    }
    
    displayPage(1); 
}

// HÀM 1: LƯỚI PHIM CHÍNH
function renderMovies(movies, page) {
    movieGrid.innerHTML = '';
    if (!movies || movies.length === 0) {
        movieGrid.appendChild(createNode('p', '', 'Không tìm thấy phim nào.')).style = "grid-column:1/-1; text-align:center; padding: 50px; color: #888;"; 
        return;
    }
    
    const startIndex = (page - 1) * 24;

    movies.forEach((movie, index) => {
        // ⚡ NÂNG CẤP 1: Bắt chuẩn type là 'series' (Phim Bộ) và 'single' (Phim Lẻ)
        const type = (movie.type === 'series') ? 'Phim Bộ' : 'Phim Lẻ';
        
        const card = createNode('div', 'ff-card');
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        
        const header = createNode('div', 'ff-card-header');
        header.appendChild(createNode('span', 'ff-rank', `#${startIndex + index + 1}`));
        const titleEl = createNode('h3', 'ff-title', movie.name);
        titleEl.title = movie.name;
        header.appendChild(titleEl);

        const img = document.createElement('img');
        img.src = movie.full_thumb; img.className = 'ff-thumb'; img.alt = movie.name;

        const tags = createNode('div', 'ff-tags');
        tags.appendChild(createNode('span', 'tag-status', type));
        
        // ⚡ NÂNG CẤP 2: Lấy điểm, nếu không có hoặc bằng 0 thì hiển thị N/A
        let rawScore = (movie.tmdb && movie.tmdb.vote_average) ? parseFloat(movie.tmdb.vote_average) : 0;
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';
        const tmdbTag = createNode('span', 'tag-tmdb', `★ ${displayScore}`);
        tags.appendChild(tmdbTag);

        const footer = createNode('div', 'ff-card-footer');
        footer.appendChild(createNode('div', 'blue-underline'));

        card.append(header, img, tags, footer);
        movieGrid.appendChild(card);
    });
}

// HÀM 2: HIỂN THỊ 2 PHIM MỚI NHẤT Ở CỘT PHẢI
function renderTopMovies(movies) {
    if (!topMoviesList) return;
    topMoviesList.innerHTML = '';
    const top2 = movies.slice(0, 2); 
    
    top2.forEach(movie => {
        const card = createNode('div', 'top-card');
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        
        const img = document.createElement('img');
        img.src = movie.full_thumb; 
        
        const overlay = createNode('div', 'top-card-overlay');
        const title = createNode('h4', 'top-card-title', movie.name);
        
        const info = createNode('div', 'top-card-info');
        
        // ⚡ NÂNG CẤP 2 (Cho cột phải): Xử lý điểm 0 -> N/A
        let rawScore = (movie.tmdb && movie.tmdb.vote_average) ? parseFloat(movie.tmdb.vote_average) : 0;
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';
        
        info.innerHTML = `<span>▶ Xem ngay</span> <span>⭐ ${displayScore}</span>`;

        overlay.append(title, info);
        card.append(img, overlay);
        topMoviesList.appendChild(card);
    });
}

// THUẬT TOÁN TẠO THANH PHÂN TRANG NHIỀU SỐ MƯỢT MÀ
function renderPagination(currentPage, totalPages) {
    const pagDiv = document.getElementById('pagination');
    pagDiv.innerHTML = '';

    // ⚡ NẾU CHỈ CÓ 1 TRANG HOẶC KHÔNG CÓ PHIM -> ẨN LUÔN THANH PHÂN TRANG
    if (totalPages <= 1) return;

    // Nút Trước ( ⏪ )
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '⏪';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { displayPage(currentPage - 1); };
    pagDiv.appendChild(prevBtn);

    // Thuật toán mảng tĩnh thông minh (Chống lỗi ô vuông)
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

    // Đổ mảng ra HTML
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

    // Nút Sau ( ⏩ )
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '⏩';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => { displayPage(currentPage + 1); };
    pagDiv.appendChild(nextBtn);
}


// CƠ CHẾ TẢI: BẤM TRANG NÀO, TẢI TRANG ĐÓ
async function displayPage(page) {
    if (isLoading) return;
    isLoading = true;
    
    // Bật Spinner
    movieGrid.innerHTML = '';
    document.getElementById('pagination').innerHTML = ''; 
    const loader = createNode('div', 'loader-container');
    loader.appendChild(createNode('div', 'spinner'));
    loader.style.display = 'flex';
    movieGrid.appendChild(loader);

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
        
        // ⚡ TÍNH TOÁN SỐ TRANG AN TOÀN (CHỐNG LỖI NaN)
        let totalPages = 1;
        if (dataObj.params && dataObj.params.pagination) {
            const p = dataObj.params.pagination;
            // Lấy totalPages, nếu không có thì lấy tổng số phim chia cho số phim 1 trang
            totalPages = p.totalPages || Math.ceil(p.totalItems / p.totalItemsPerPage) || 1;
        }
        
        // Cứu cánh: Nếu API lỗi không tính được trang, tự đoán bằng số lượng phim
        if (totalPages === 1) {
            if (items.length === 24) totalPages = page + 1; // Đủ 24 phim -> Mở đường cho trang tiếp theo
            else totalPages = page; // Ít hơn 24 phim -> Chốt luôn đây là trang cuối
        }

        if (items.length > 0) {
            let imgDomain = (dataObj.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live').replace(/\/$/, ''); 
            const processedItems = items.map(m => {
                let thumb = m.thumb_url || m.poster_url || '';
                if (!thumb.startsWith('http')) {
                    if (!thumb.includes('uploads/movies/')) thumb = '/uploads/movies/' + thumb.replace(/^\//, '');
                    else if (!thumb.startsWith('/')) thumb = '/' + thumb;
                    m.full_thumb = imgDomain + thumb;
                } else { m.full_thumb = thumb; }
                return m;
            });
            
            renderMovies(processedItems, page);
            renderTopMovies(processedItems);
            renderPagination(page, totalPages); // Truyền totalPages vào để vẽ nút
            document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            renderMovies([], page);
        }
    } catch (error) { console.error("Lỗi API:", error); renderMovies([], page); }
    
    isLoading = false;
}

// EVENTS (ĐÃ FIX LỖI TẢI TRANG ĐẦU VÀ NÚT NGÔI NHÀ)

// ⚡ 1. Sửa chức năng nút 🏠 để nó chạy về trang chủ mặc định (setMode 'new')
document.getElementById('navHome').onclick = () => {
    // Xóa active ở các thể loại và pill để làm nổi bật nút 🏠
    document.querySelectorAll('.cat-link, .genre-pill').forEach(b => b.classList.remove('active')); 
    
    // Đặt chế độ Phim mới
    setMode('new', '', 'Phim Mới Cập Nhật');
};

document.getElementById('searchBtn').onclick = () => { 
    if (searchInput.value.trim()) {
        document.querySelectorAll('.cat-link, .genre-pill').forEach(b => b.classList.remove('active')); 
        setMode('search', searchInput.value.trim(), `Kết quả tìm kiếm: "${searchInput.value.trim()}"`);
    }
};
searchInput.onkeypress = (e) => { if (e.key === 'Enter') document.getElementById('searchBtn').click(); };

// KHỞI TẠO (⚡ 2. FIX LỖI TRẮNG TRANG KHI MỚI VÀO)
initMenus();

// THAY THẾ LỆNH displayPage(1) cũ bằng lệnh này để tải trang chủ mặc định 1:1 với Ophim
setMode('new', '', 'Phim Mới Cập Nhật');