/**
 * ============================================================================
 * TÊN DỰ ÁN   : FREEFILM WEB APP
 * PHIÊN BẢN   : v0.0.1 (Pixel-Perfect Refresh)
 * MÔ TẢ       : Xử lý logic API, render giao diện, và Thanh tìm kiếm tương tác.
 * ============================================================================
 */

// ============================================================================
// PHẦN 1: CẤU HÌNH & BIẾN TOÀN CỤC (CONFIG & STATE)
// ============================================================================

const API_BASE = 'https://ophim1.com/v1/api';
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

// --- Các phần tử DOM (DOM Elements) ---
const movieGrid = document.getElementById('movie-grid');
const prominentGrid = document.getElementById('random-prominent-grid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const closeSearch = document.getElementById('closeSearch');
const navAndSearch = document.getElementById('navAndSearch');

// --- Quản lý trạng thái (State Management) ---
let currentMode = 'new';    // Chế độ hiện tại: 'new', 'search'
let currentQuery = '';      // Giá trị tìm kiếm
let isLoading = false;      // Cờ chống spam click API
let currentItems = [];      // Mảng lưu phim hiện tại đểshuffle ngẫu nhiên

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
 * Khởi tạo Menu Thể loại con (Section 2 - Pills) và Cột phải Mobile
 */
function initMenus() {
    const genreContainer = document.getElementById('genreContainer');
    if (!genreContainer) return;

    // Dữ liệu thể loại (Thường API sẽ cung cấp, ở đây dùng tạm tĩnh)
    const allGenres = [
        { name: 'Hành Động', slug: 'hanh-dong' }, { name: 'Tình Cảm', slug: 'tinh-cam' },
        { name: 'Hài Hước', slug: 'hai-huoc' }, { name: 'Cổ Trang', slug: 'co-trang' },
        { name: 'Tâm Lý', slug: 'tam-ly' }, { name: 'Hình Sự', slug: 'hinh-su' },
        { name: 'Chiến Tranh', slug: 'chien-tranh' }, { name: 'Võ Thuật', slug: 'vo-thuat' }
    ];

    genreContainer.innerHTML = '';
    
    // Render tất cả thể loại dạng Pill (viên thuốc) vào Section 2
    allGenres.forEach(genre => {
        const btn = createNode('div', 'genre-pill ff-pill-cyan', genre.name);
        // ... Xử lý bấm thể loại (Coming Soon)...
        genreContainer.appendChild(btn);
    });
}

/**
 * Chuyển đổi chế độ xem
 */
function setMode(mode, query) {
    if (isLoading) return; 
    currentMode = mode; 
    currentQuery = query; 
    
    // Reset về trang 1 mỗi khi đổi chế độ
    displayPage(1); 
}


// ============================================================================
// PHẦN 3: XUẤT GIAO DIỆN LÊN MÀN HÌNH (UI RENDERING)
// ============================================================================

/**
 * Render Lưới phim "Phim mới cập nhật" (4 cột, canon v0.0.1)
 */
function renderMovies(movies, page) {
    movieGrid.innerHTML = '';
    
    if (!movies || movies.length === 0) {
        movieGrid.appendChild(createNode('p', '', 'Không tìm thấy phim nào.')).style = "grid-column:1/-1; text-align:center; padding: 50px; color: #888;"; 
        return;
    }
    
    // Tính toán số thứ tự phim (Ví dụ: Trang 2 bắt đầu từ #25)
    const startIndex = (page - 1) * 24;

    movies.forEach((movie, index) => {
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

        // Footer Card (Tags TMDB)
        const tags = createNode('div', 'ff-tags');
        let rawScore = (movie.tmdb && movie.tmdb.vote_average) ? parseFloat(movie.tmdb.vote_average) : 0;
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';
        tags.appendChild(createNode('span', 'tag-tmdb', `★ ${displayScore}`));

        const footer = createNode('div', 'ff-card-footer');
        footer.appendChild(createNode('div', 'blue-underline'));

        card.append(header, img, tags, footer);
        movieGrid.appendChild(card);
    });
}

/**
 * Render Section 1: 2 phim nổi bật ngẫu nhiên (Chuẩn Poster stands 2:3)
 */
function renderRandomProminent(movies) {
    prominentGrid.innerHTML = '';
    
    // Thuật toán: Shuffle mảng phim hiện có và lấy 2 phim đầu tiên
    if (!movies || movies.length < 2) return;
    
    // Shuffle mảng (Bản sao để không làm hỏng lưới phim chính)
    const shuffled = [...movies].sort(() => 0.5 - Math.random());
    const selectedTwo = shuffled.slice(0, 2);

    selectedTwo.forEach(movie => {
        const card = createNode('div', 'prominent-card ff-pill-btn');
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        
        // Ảnh Thumbnail ĐỨNG tỉ lệ 2:3
        const img = document.createElement('img');
        img.src = movie.full_thumb; 
        img.className = 'ff-thumb'; 
        img.alt = movie.name;

        const titleEl = createNode('h3', 'ff-title', movie.name);
        titleEl.title = movie.name;

        // Tags
        const tags = createNode('div', 'ff-tags');
        let rawScore = (movie.tmdb && movie.tmdb.vote_average) ? parseFloat(movie.tmdb.vote_average) : 0;
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';
        tags.appendChild(createNode('span', 'tag-tmdb', `★ ${displayScore}`));

        card.append(img, titleEl, tags);
        prominentGrid.appendChild(card);
    });
}

/**
 * Thuật toán Phân trang
 */
function renderPagination(currentPage, totalPages) {
    const pagDiv = document.getElementById('pagination');
    pagDiv.innerHTML = '';
    if (totalPages <= 1) return;

    // ... (Giữ nguyên logic phân trang có số chuẩn v0.0.1) ...
    // Nút [⏪]
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '⏪';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => displayPage(currentPage - 1);
    pagDiv.appendChild(prevBtn);

    // Mảng số trang thông minh
    let pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) pages = [1, 2, 3, 4, 5, '...'];
        else if (currentPage >= totalPages - 2) pages = ['...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        else pages = ['...', currentPage - 1, currentPage, currentPage + 1, '...'];
    }

    pages.forEach(p => {
        if (p === '...') {
            pagDiv.appendChild(createNode('span', 'page-dots', '...'));
        } else {
            const btn = createNode('button', `page-btn ${p === currentPage ? 'active' : ''}`, p);
            btn.onclick = () => { if (p !== currentPage) displayPage(p); };
            pagDiv.appendChild(btn);
        }
    });

    // Nút [⏩]
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '⏩';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => displayPage(currentPage + 1);
    pagDiv.appendChild(nextBtn);
}


// ============================================================================
// PHẦN 4: GIAO TIẾP API & XỬ LÝ LOGIC LÕI (CORE DATA LOGIC)
// ============================================================================

/**
 * Hàm Lõi: Lấy dữ liệu API và hiển thị
 */
async function displayPage(page) {
    if (isLoading) return;
    isLoading = true;
    
    // Reset Grid & Hiển thị Spinner
    movieGrid.innerHTML = '';
    document.getElementById('pagination').innerHTML = ''; 
    const loader = createNode('div', 'loader-container');
    loader.appendChild(createNode('div', 'spinner'));
    loader.style.display = 'flex';
    movieGrid.appendChild(loader);

    try {
        // Xây dựng URL API dựa trên Mode
        let apiUrl = '';
        if (currentMode === 'new') apiUrl = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`;
        else if (currentMode === 'search') apiUrl = `${API_BASE}/tim-kiem?keyword=${encodeURIComponent(currentQuery)}&page=${page}`;

        // Gọi API
        const res = await fetch(apiUrl, fetchOptions); 
        const json = await res.json();
        const dataObj = json.data || json; 
        const items = dataObj.items || json.items || [];
        
        // --- XỬ LÝ SỐ TRANG ---
        let totalPages = 1;
        if (dataObj.params && dataObj.params.pagination) {
            const p = dataObj.params.pagination;
            totalPages = p.totalPages || Math.ceil(p.totalItems / p.totalItemsPerPage) || 1;
        }

        // --- XỬ LÝ HÌNH ẢNH & CDN ---
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
            
            // 🔥 UPDATE PHẦN NGẪU NHIÊN NẾU TẢI TRANG CHỦ LẦN ĐẦU
            if (currentMode === 'new' && page === 1 && prominentGrid.innerHTML.includes('Đang tải')) {
                renderRandomProminent(processedItems);
            }

            // Đẩy dữ liệu vào các hàm render grid chính
            renderMovies(processedItems, page);
            renderPagination(page, totalPages);
            
            // Tự động cuộn lên đầu Grid khi tải xong trang mới
            const content = document.querySelector('.main-content');
            if(content) content.scrollTo({ top: 0, behavior: 'smooth' });
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
// PHẦN 5: BẮT SỰ KIỆN TÌM KIẾM & CHẠY ỨNG DỤNG (EVENTS & BOOTSTRAP)
// ============================================================================

/**
 * ⚡ CORE FEATURE v0.0.1: Xử lý tương tác Thanh tìm kiếm mượt mà
 */

// 1. Kích hoạt tìm kiếm: Bấm nút kính lúp 🔍
searchBtn.onclick = () => {
    navAndSearch.classList.add('search-active'); // Thêm class để CSS kích hoạt overlay chèn lên
    searchInput.focus(); // Tự động đưa con trỏ vào ô nhập liệu
};

// 2. Đóng tìm kiếm: Bấm nút X ✕
closeSearch.onclick = () => {
    navAndSearch.classList.remove('search-active'); // Tháo class để CSS ẩn overlay đi
    searchInput.value = ''; // Xóa chữ trong ô
};

// 3. Thực hiện tìm kiếm: Khi nhấn Enter trong ô nhập liệu
searchInput.onkeypress = (e) => { 
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            setMode('search', query);
        } else {
            // Nếu ô trống mà nhấn Enter, quay về trang chủ
            setMode('new', '');
        }
    } 
};

// --- Nút Trang Chủ trên Sidebar (PC) & Bottom Nav (Mobile) ---
const navHome = document.getElementById('navHome');
if(navHome) {
    navHome.onclick = () => {
        if(currentMode === 'new') return; // Đang ở home rồi thì thôi
        setMode('new', '');
        if(navAndSearch.classList.contains('search-active')) {
            closeSearch.click(); // Đóng thanh tìm kiếm nếu đang mở
        }
    };
}

// --- Menu Trượt Mobile (⭐) ---
const btnTogglePanel = document.getElementById('toggleRightPanel');
const rightPanelMenu = document.querySelector('.right-panel');

if (btnTogglePanel && rightPanelMenu) {
    btnTogglePanel.onclick = () => {
        // Bật/tắt class show-panel để trượt ra/vào (Chỉ có CSS ở Mobile xử lý)
        rightPanelMenu.classList.toggle('show-panel');
        // Làm sáng nút ⭐ khi panel đang mở
        btnTogglePanel.classList.toggle('active');
    };
}

// ============================================================================
// KHỞI CHẠY ỨNG DỤNG (BOOTSTRAP)
// ============================================================================
initMenus();
setMode('new', ''); // Tải trang chủ mặc định (Phim mới nhất)