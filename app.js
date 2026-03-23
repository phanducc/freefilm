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
    CATEGORIES.forEach(cat => {
        const btn = createNode('div', 'genre-btn', cat.name);
        btn.onclick = () => { document.querySelectorAll('#categoryContainer .genre-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); setMode('category', cat.slug, `Danh Mục: ${cat.name}`); };
        document.getElementById('categoryContainer').appendChild(btn);
    });
    GENRES.forEach(genre => {
        const btn = createNode('div', 'genre-btn', genre.name);
        btn.onclick = () => { document.querySelectorAll('#genreContainer .genre-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); setMode('genre', genre.slug, `Thể Loại: ${genre.name}`); };
        document.getElementById('genreContainer').appendChild(btn);
    });
}

function setMode(mode, query, title) {
    if (isLoading) return;
    currentMode = mode; currentQuery = query; pageTitle.innerText = title;
    
    document.getElementById('categoryModal').classList.add('hidden'); 
    document.getElementById('genreModal').classList.add('hidden');
    document.getElementById('navHome').classList.toggle('active', mode === 'new' || mode === 'search');
    document.getElementById('navCategory').classList.toggle('active', mode === 'category');
    document.getElementById('navGenre').classList.toggle('active', mode === 'genre');
    
    displayPage(1); 
}

function renderMovies(movies, page) {
    movieGrid.innerHTML = '';
    if (!movies || movies.length === 0) {
        movieGrid.appendChild(createNode('p', '', 'Không tìm thấy phim nào.')).style = "grid-column:1/-1; text-align:center; padding: 50px; color: #888;"; 
        return;
    }
    
    // Mỗi trang Ophim có 24 phim, tính toán số Rank cho ngầu
    const startIndex = (page - 1) * 24;

    movies.forEach((movie, index) => {
        const type = (movie.type === 'series' || movie.type === 'hoathinh') ? 'Phim Bộ' : 'Phim Lẻ';
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
        tags.appendChild(createNode('span', 'tag-quality', movie.quality || movie.lang || 'HD'));

        const footer = createNode('div', 'ff-card-footer');
        footer.appendChild(createNode('div', 'blue-underline'));

        card.append(header, img, tags, footer);
        movieGrid.appendChild(card);
    });
}

// THUẬT TOÁN TẠO THANH PHÂN TRANG NHIỀU SỐ MƯỢT MÀ
function renderPagination(currentPage, totalPages) {
    const pagDiv = document.getElementById('pagination');
    pagDiv.innerHTML = '';
    if (totalPages <= 1) return;

    // Nút Trước
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '«';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => { displayPage(currentPage - 1); };
    pagDiv.appendChild(prevBtn);

    // Thuật toán gộp số thông minh (Tự loại bỏ số trùng và sắp xếp)
    let pageNumbers = new Set([1, currentPage - 1, currentPage, currentPage + 1, totalPages]);
    let sortedUniquePages = Array.from(pageNumbers)
        .filter(p => p > 0 && p <= totalPages) 
        .sort((a, b) => a - b); 

    sortedUniquePages.forEach((p, index) => {
        // Thêm dấu "..." nếu các số không liền kề nhau
        if (index > 0 && sortedUniquePages[index - 1] !== p - 1) {
            const dots = document.createElement('span');
            dots.className = 'page-dots';
            dots.innerText = '...';
            pagDiv.appendChild(dots);
        }
        
        const btn = document.createElement('button');
        btn.className = `page-btn ${p === currentPage ? 'active' : ''}`;
        btn.innerText = p;
        btn.onclick = () => { if(p !== currentPage) displayPage(p); };
        pagDiv.appendChild(btn);
    });

    // Nút Sau
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '»';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.onclick = () => { displayPage(currentPage + 1); };
    pagDiv.appendChild(nextBtn);
}

// CƠ CHẾ TẢI: BẤM TRANG NÀO, TẢI TRANG ĐÓ (1:1 với API)
async function displayPage(page) {
    if (isLoading) return;
    isLoading = true;
    
    // Bật Spinner
    movieGrid.innerHTML = '';
    document.getElementById('pagination').innerHTML = ''; // Xóa phân trang tạm lúc đang tải
    const loader = createNode('div', 'loader-container');
    loader.appendChild(createNode('div', 'spinner'));
    loader.style.display = 'flex';
    movieGrid.appendChild(loader);

    try {
        let apiUrl = '';
        // Đã thay /home thành /danh-sach/phim-moi-cap-nhat
        if (currentMode === 'new') apiUrl = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${page}`;
        else if (currentMode === 'category') apiUrl = `${API_BASE}/danh-sach/${currentQuery}?page=${page}`;
        else if (currentMode === 'genre') apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${page}`;
        else if (currentMode === 'search') apiUrl = `${API_BASE}/tim-kiem?keyword=${encodeURIComponent(currentQuery)}&page=${page}`;

        const res = await fetch(apiUrl, fetchOptions); 
        const json = await res.json();
        
        const dataObj = json.data || json; 
        const items = dataObj.items || json.items || [];
        let totalPages = (dataObj.params && dataObj.params.pagination) ? dataObj.params.pagination.totalPages : 1;

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
            renderPagination(page, totalPages);
            document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            renderMovies([], page);
        }
    } catch (error) { console.error("Lỗi API:", error); renderMovies([], page); }
    
    isLoading = false;
}

// EVENTS
document.getElementById('navHome').onclick = () => setMode('new', '', 'Phim Mới Cập Nhật');
document.getElementById('navCategory').onclick = () => { document.getElementById('categoryModal').classList.toggle('hidden'); document.getElementById('genreModal').classList.add('hidden'); };
document.getElementById('navGenre').onclick = () => { document.getElementById('genreModal').classList.toggle('hidden'); document.getElementById('categoryModal').classList.add('hidden'); };
document.getElementById('searchBtn').onclick = () => { if (searchInput.value.trim()) setMode('search', searchInput.value.trim(), `Kết quả tìm kiếm: "${searchInput.value.trim()}"`); };
searchInput.onkeypress = (e) => { if (e.key === 'Enter') document.getElementById('searchBtn').click(); };

initMenus(); displayPage(1);