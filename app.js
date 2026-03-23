// ========================================================
// APP.JS - XỬ LÝ DỮ LIỆU PHIM TỪ OPHIM1.COM
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
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

let currentMode = 'new', currentQuery = '', allCachedMovies = [], currentLocalPage = 1, apiPageToFetch = 1;
let isLoading = false;
const MOVIES_PER_PAGE = window.innerWidth > 768 ? 25 : 20;
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

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
    document.getElementById('categoryModal').classList.add('hidden'); document.getElementById('genreModal').classList.add('hidden');
    document.getElementById('navHome').classList.toggle('active', mode === 'new' || mode === 'search');
    document.getElementById('navCategory').classList.toggle('active', mode === 'category');
    document.getElementById('navGenre').classList.toggle('active', mode === 'genre');
    allCachedMovies = []; currentLocalPage = 1; apiPageToFetch = 1;
    displayLocalPage(1).then(() => { document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' }); });
}

function renderMovies(movies, startIndex) {
    movieGrid.innerHTML = '';
    if (!movies || movies.length === 0) {
        movieGrid.appendChild(createNode('p', '', 'Không tìm thấy phim nào.')).style = "grid-column:1/-1; text-align:center; padding: 50px; color: #888;"; return;
    }
    
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

async function fetchAndCacheMovies(apiPage) {
    if (isLoading) return null;
    isLoading = true;
    
    movieGrid.innerHTML = '';
    const loader = createNode('div', 'loader-container');
    loader.appendChild(createNode('div', 'spinner'));
    loader.style.display = 'flex';
    movieGrid.appendChild(loader);

    try {
        let apiUrl = '';
        
        // SỬA LỖI TRANG CHỦ: Dùng API phim mới cập nhật để có thể lật hàng ngàn trang
        if (currentMode === 'new') apiUrl = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${apiPage}`;
        else if (currentMode === 'category') apiUrl = `${API_BASE}/danh-sach/${currentQuery}?page=${apiPage}`;
        else if (currentMode === 'genre') apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${apiPage}`;
        else if (currentMode === 'search') apiUrl = `${API_BASE}/tim-kiem?keyword=${encodeURIComponent(currentQuery)}&page=${apiPage}`;

        const res = await fetch(apiUrl, fetchOptions); 
        const json = await res.json();
        
        const dataObj = json.data || json; 
        const items = dataObj.items || json.items || [];

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
            
            allCachedMovies = [...allCachedMovies, ...processedItems];
            isLoading = false;
            return { totalPages: (dataObj.params && dataObj.params.pagination) ? dataObj.params.pagination.totalPages : 1 };
        }
    } catch (error) { console.error("Lỗi API:", error); }
    
    isLoading = false;
    return null;
}

async function displayLocalPage(page) {
    const start = (page - 1) * MOVIES_PER_PAGE; const end = start + MOVIES_PER_PAGE;
    while (allCachedMovies.length < end) {
        const paginate = await fetchAndCacheMovies(apiPageToFetch);
        if (paginate && apiPageToFetch < paginate.totalPages) apiPageToFetch++; else break;
    }
    const moviesToDisplay = allCachedMovies.slice(start, end);
    renderMovies(moviesToDisplay, start);
    pageInfo.innerText = `Trang ${page}`;
    prevBtn.disabled = page === 1; nextBtn.disabled = moviesToDisplay.length < MOVIES_PER_PAGE;
}

// EVENTS
document.getElementById('navHome').onclick = () => setMode('new', '', 'Phim Mới Cập Nhật');
document.getElementById('navCategory').onclick = () => { document.getElementById('categoryModal').classList.toggle('hidden'); document.getElementById('genreModal').classList.add('hidden'); };
document.getElementById('navGenre').onclick = () => { document.getElementById('genreModal').classList.toggle('hidden'); document.getElementById('categoryModal').classList.add('hidden'); };
prevBtn.onclick = () => { currentLocalPage--; displayLocalPage(currentLocalPage).then(() => document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' })); };
nextBtn.onclick = () => { currentLocalPage++; displayLocalPage(currentLocalPage).then(() => document.querySelector('.main-content').scrollTo({ top: 0, behavior: 'smooth' })); };
document.getElementById('searchBtn').onclick = () => { if (searchInput.value.trim()) setMode('search', searchInput.value.trim(), `Kết quả tìm kiếm: "${searchInput.value.trim()}"`); };
searchInput.onkeypress = (e) => { if (e.key === 'Enter') document.getElementById('searchBtn').click(); };

initMenus(); displayLocalPage(1);