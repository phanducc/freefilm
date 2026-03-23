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
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');

let currentMode = 'new', currentQuery = '', allCachedMovies = [], currentLocalPage = 1, apiPageToFetch = 1;
const MOVIES_PER_PAGE = window.innerWidth > 768 ? 25 : 20;
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

function initMenus() {
    CATEGORIES.forEach(cat => {
        const btn = document.createElement('div'); btn.className = 'genre-btn'; btn.innerText = cat.name;
        btn.onclick = () => { document.querySelectorAll('#categoryContainer .genre-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); setMode('category', cat.slug, `Danh Mục: ${cat.name}`); };
        document.getElementById('categoryContainer').appendChild(btn);
    });
    GENRES.forEach(genre => {
        const btn = document.createElement('div'); btn.className = 'genre-btn'; btn.innerText = genre.name;
        btn.onclick = () => { document.querySelectorAll('#genreContainer .genre-btn').forEach(b => b.classList.remove('active')); btn.classList.add('active'); setMode('genre', genre.slug, `Thể Loại: ${genre.name}`); };
        document.getElementById('genreContainer').appendChild(btn);
    });
}

function setMode(mode, query, title) {
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
        movieGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; padding: 50px; color: #888;">Không tìm thấy phim nào.</p>'; return;
    }
    movies.forEach((movie, index) => {
        const type = (movie.type === 'series' || movie.type === 'hoathinh') ? 'Phim Bộ' : 'Phim Lẻ';
        const card = document.createElement('div'); card.className = 'ff-card';
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;
        card.innerHTML = `
            <div class="ff-card-header"><span class="ff-rank">#${startIndex + index + 1}</span><h3 class="ff-title" title="${movie.name}">${movie.name}</h3></div>
            <img src="${movie.full_thumb}" class="ff-thumb" alt="${movie.name}">
            <div class="ff-tags"><span class="tag-status">${type}</span><span class="tag-quality">${movie.quality || movie.lang || 'HD'}</span></div>
            <div class="ff-card-footer"><div class="blue-underline"></div></div>
        `;
        movieGrid.appendChild(card);
    });
}

async function fetchAndCacheMovies(apiPage) {
    try {
        movieGrid.innerHTML = '<p style="grid-column:1/-1; text-align:center; color:#aaa; padding: 50px;">Đang tải dữ liệu từ Ophim...</p>';
        let apiUrl = '';
        
        // SỬA LỖI API HOME: Dùng v1/api/home cho trang chủ, kết hợp page
        if (currentMode === 'new') apiUrl = `${API_BASE}/home?page=${apiPage}`;
        else if (currentMode === 'category') apiUrl = `${API_BASE}/danh-sach/${currentQuery}?page=${apiPage}`;
        else if (currentMode === 'genre') apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${apiPage}`;
        else if (currentMode === 'search') apiUrl = `${API_BASE}/tim-kiem?keyword=${currentQuery}&page=${apiPage}`;

        const res = await fetch(apiUrl, fetchOptions); 
        const json = await res.json();
        
        const dataObj = json.data || json; 
        const items = dataObj.items || json.items || [];

        if (items.length > 0) {
            // SỬA LỖI ẢNH: Xử lý gộp domain chuẩn
            let imgDomain = dataObj.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live/uploads/movies';
            imgDomain = imgDomain.replace(/\/$/, ''); // Xóa dấu gạch chéo thừa ở cuối nếu có

            const processedItems = items.map(m => {
                let thumb = m.thumb_url || m.poster_url || '';
                thumb = thumb.replace(/^\//, ''); // Xóa dấu gạch chéo thừa ở đầu tên ảnh
                m.full_thumb = (thumb.startsWith('http')) ? thumb : `${imgDomain}/${thumb}`;
                return m;
            });
            
            allCachedMovies = [...allCachedMovies, ...processedItems];
            return { totalPages: (dataObj.params && dataObj.params.pagination) ? dataObj.params.pagination.totalPages : 1 };
        }
    } catch (error) { console.error("Lỗi API:", error); }
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
searchBtn.onclick = () => { if (searchInput.value.trim()) setMode('search', searchInput.value.trim(), `Kết quả tìm kiếm: "${searchInput.value.trim()}"`); };
searchInput.onkeypress = (e) => { if (e.key === 'Enter') searchBtn.click(); };

initMenus(); displayLocalPage(1);