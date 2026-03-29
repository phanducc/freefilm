/**
 * FREEFILM - CINEMATIC UI SCRIPT
 */

const API_BASE = 'https://ophim1.com/v1/api';
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

// --- Các phần tử DOM (DOM Elements) ---
const movieGrid = document.getElementById('movie-grid');
const prominentGrid = document.getElementById('random-prominent-grid');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const closeSearch = document.getElementById('closeSearch');
const navPillContainer = document.getElementById('navPillContainer');

// --- Quản lý trạng thái (State Management) ---
let currentMode = 'new';    // Chế độ hiện tại: 'new', 'search'
let currentQuery = '';      // Giá trị tìm kiếm
let isLoading = false;      // Cờ chống spam click API

// ============================================================================
// PHẦN 1: TIỆN ÍCH & KHỞI TẠO (UTILITIES & INIT)
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
 * Shuffle mảng ngẫu nhiên (Cho banner prominent)
 */
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

/**
 * Khởi tạo Section 2: Toàn bộ thể loại (Dạng Pills đầy đủ 19 thể loại)
 */
function initGenres() {
    const genreContainer = document.getElementById('genreContainer');
    if (!genreContainer) return;

    // Dữ liệu "đầy đủ thể loại" (Chuẩn theo các ảnh mẫu, APIs thường có 15-20 thể loại)
    const allGenres = [
        { name: '🔥 Trending', slug: 'phim-moi-cap-nhat' }, // Combo 'Phim mới' vào 'Trending'
        { name: '⚔️ Hành Động', slug: 'hanh-dong' },
        { name: '🧭 Phiêu Lưu', slug: 'phieu-luu' },
        { name: '😂 Hài Hước', slug: 'hai-huoc' },
        { name: '🚓 Hình Sự', slug: 'hinh-su' },
        { name: '🎥 Tài Liệu', slug: 'tai-lieu' },
        { name: '❤️ Lãng Mạn', slug: 'tinh-cam' },
        { name: '🎭 Chính Kịch', slug: 'chinh-kich' },
        { name: '🧸 Hoạt Hình', slug: 'hoat-hinh' },
        { name: '👨‍👩‍👧 Gia Đình', slug: 'gia-dinh' },
        { name: '💀 Kinh Dị', slug: 'kinh-di' },
        { name: '⭐ Đặc Sắc', slug: 'tam-ly' },
        { name: '🌙 Cổ Trang', slug: 'co-trang' },
        { name: '🔫 Chiến Tranh', slug: 'chien-tranh' },
        { name: '🕵️ Bí Ẩn', slug: 'bi-an' },
        { name: '🧠 Khoa Học', slug: 'khoa-hoc' },
        { name: '🛸 Viễn Tưởng', slug: 'vien-tuong' },
        { name: '🎼 Âm Nhạc', slug: 'am-nhac' },
        { name: '🤠 Miền Tây', slug: 'mien-tay' }
    ];

    genreContainer.innerHTML = '';
    
    // Render tất cả thể loại dạng Pill vào Section 2
    allGenres.forEach((genre, index) => {
        // Mặc định chọn Trending khi load lần đầu
        const pill = createNode('div', `genre-pill ${index === 0 ? 'active' : ''}`, genre.name);
        
        pill.onclick = () => {
            if (isLoading) return;
            // Xóa active toàn bộ và gắn active cho nút này
            document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
            document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
            pill.classList.add('active');
            
            // Xử lý 'Trending' (Quay về 'phim mới cập nhật')
            if (genre.slug === 'phim-moi-cap-nhat') {
                setMode('new', '', 'Phim mới cập nhật');
            } else {
                setMode('genre', genre.slug, `Thể Loại: ${genre.name.replace(/[^a-zA-ZÀ-ỹ\s]/g, '').trim()}`);
            }
        };
        genreContainer.appendChild(pill);
    });
}

/**
 * Chuyển đổi chế độ xem
 */
function setMode(mode, query, title) {
    if (isLoading) return; 
    currentMode = mode; 
    currentQuery = query; 
    if(title) {
        document.getElementById('movie-grid').parentNode.querySelector('h2').innerText = title;
    }
    // Reset về trang 1 mỗi khi đổi chế độ
    displayPage(1); 
}


// ============================================================================
// PHẦN 2: Render 2 Banners Ngẫu Nhiên (Stands 2:3)
// ============================================================================
function renderRandomProminent(movies) {
    prominentGrid.innerHTML = '';
    
    // Chỉ render nếu mảng phim có ít nhất 2 phim
    if (!movies || movies.length < 2) {
        // Fallback if no movies
        document.querySelector('.hero-grid').parentNode.style.display = 'none';
        return;
    }
    document.querySelector('.hero-grid').parentNode.style.display = 'block';

    // Shuffle mảng để lấy 2 phim ngẫu nhiên
    const shuffledItems = shuffleArray([...movies]); // Bản sao mảng để shuffle
    const selectedTwo = shuffledItems.slice(0, 2); // Lấy 2 phim đầu

    selectedTwo.forEach(movie => {
        const card = createNode('div', 'prominent-card ff-pill-cyan');
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        
        // Ảnh Thumbnail ĐỨNG tỉ lệ 2:3
        const img = document.createElement('img');
        img.src = movie.full_thumb; 
        img.className = 'ff-thumb'; 
        img.alt = movie.name;

        const titleEl = createNode('h3', 'ff-title', movie.name);
        titleEl.title = movie.name;

        // Footer Card (Tags TMDB)
        const tags = createNode('div', 'ff-tags');
        let rawScore = (movie.tmdb && movie.tmdb.vote_average) ? parseFloat(movie.tmdb.vote_average) : 0;
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';
        tags.appendChild(createNode('span', 'tag-tmdb', `★ ${displayScore}`));

        card.append(img, titleEl, tags);
        prominentGrid.appendChild(card);
    });
}


// ============================================================================
// PHẦN 3: XUẤT GIAO DIỆN LÊN MÀN HÌNH (UI RENDERING - movie grid)
// ============================================================================

/**
 * Render Lưới phim "Phim mới cập nhật" (4 cộtv0.0.1)
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
 * Thuật toán Phân trang
 */
function renderPagination(currentPage, totalPages) {
    const pagDiv = document.getElementById('pagination');
    pagDiv.innerHTML = '';
    if (totalPages <= 1) return;

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
 * Hàm Lõi: Lấy dữ liệu từ API và hiển thị
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
        else if (currentMode === 'genre') apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${page}`;
        else if (currentMode === 'search') apiUrl = `${API_BASE}/tim-kiem?keyword=${encodeURIComponent(currentQuery)}&page=${page}`;

        // Gọi API Ophim
        const res = await fetch(apiUrl, fetchOptions); 
        const json = await res.json();
        const dataObj = json.data || json; 
        const items = dataObj.items || json.items || [];
        
        // --- XỬ LÝ LỖI SỐ TRANG ---
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
            
            // 🔥 UPDATE PHẦN NGẪU NHIÊN NẾU TẢI TRANG CHỦ LẦN ĐẦU (Chỉ khi load Phim mới và trang 1)
            if (currentMode === 'new' && page === 1 && (prominentGrid.innerHTML === '' || prominentGrid.innerHTML.includes('Đang tải'))) {
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
// PHẦN 5: BẮT SỰ KIỆN TÌM KIẾM TƯƠNG TÁC (NEW CORE FEATURE)
// ============================================================================

/**
 * ⚡ CORE FEATURE: Xử lý tương tác Thanh tìm kiếm chèn lên (Pill overlay)
 */

// 1. Kích hoạt tìm kiếm: Bấm nút kính lúp 🔍
searchBtn.onclick = () => {
    // Thêm class search-active để CSS kích hoạt overlay chèn lên 4 thể loại
    navPillContainer.classList.add('search-active');
    searchInput.focus(); // Tự động đưa con trỏ vào ô nhập liệu
};

// 2. Đóng tìm kiếm: Bấm nút X ✕
closeSearch.onclick = () => {
    navPillContainer.classList.remove('search-active');
    searchInput.value = ''; // Xóa chữ trong ô
};

// 3. Thực hiện tìm kiếm: Khi nhấn Enter trong ô nhập liệu
searchInput.onkeypress = (e) => { 
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            // Khi search, tắt các active của thể loại và pill đi
            document.querySelectorAll('.genre-pill, .nav-item').forEach(p => p.classList.remove('active'));
            setMode('search', query, `Kết quả tìm kiếm: "${query}"`);
        } else {
            // Nếu ô trống mà nhấn Enter, quay về trang chủ
            closeSearch.click(); // Đóng thanh search
            displayPage(1); // Load lại phim mới nhất
        }
    } 
};

// --- Nút Trang Chủ trên Sidebar (PC) & Bottom Nav (Mobile) ---
const navHome = document.getElementById('navHome');
if(navHome) {
    navHome.onclick = () => {
        if(currentMode === 'new') return; // Đang ở home rồi thì thôi
        
        // Active lại 'Trending' (Pill đầu tiên)
        document.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
        const genreContainer = document.getElementById('genreContainer');
        if(genreContainer && genreContainer.firstChild) {
            genreContainer.firstChild.classList.add('active');
        }
        
        setMode('new', '');
        if(navPillContainer.classList.contains('search-active')) {
            closeSearch.click(); // Đóng thanh tìm kiếm nếu đang mở
        }
    };
}

// --- Menu Trượt Mobile (⭐) ---
const btnTogglePanel = document.getElementById('toggleRightPanel');
const rightPanelMenu = document.querySelector('.right-panel');

if (btnTogglePanel && rightPanelMenu) {
    btnTogglePanel.onclick = () => {
        // Bật/tắt class show-panel để trượt ra/vào (Chỉ có CSS Mobile xử lý)
        rightPanelMenu.classList.toggle('show-panel');
        // Làm sáng nút ⭐ khi panel đang mở
        btnTogglePanel.classList.toggle('active');
    };
}

// ============================================================================
// KHỞI CHẠY ỨNG DỤNG (BOOTSTRAP)
// ============================================================================
initGenres();
setMode('new', ''); // Tải trang chủ mặc định (Phim mới nhất)