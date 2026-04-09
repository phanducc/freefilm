document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('siteIntro');
    const introVid = document.getElementById('introVideo');

    if (intro) {
        if (!sessionStorage.getItem('introPlayed')) {
            
            const hideIntro = () => {
                intro.classList.add('hidden');
                sessionStorage.setItem('introPlayed', 'true');
                setTimeout(() => intro.remove(), 800); 
            };

            setTimeout(hideIntro, 3000);

        } else {
            intro.style.display = 'none';
            intro.remove();
        }
    }
});

const API_BASE = 'https://ophim1.com/v1/api';
const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

const movieGrid = document.getElementById('movieGrid');
const heroGrid = document.getElementById('heroGrid');
const genresScroll = document.getElementById('genresScroll');
const sectionTitle = document.getElementById('sectionTitle');

const navPill = document.getElementById('navPill');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');

let currentMode = 'new';
let currentQuery = '';
let isLoading = false;
let isHeroRendered = false;

searchToggleBtn.onclick = () => {
    navPill.classList.add('searching');
    searchInput.focus();
};

closeSearchBtn.onclick = () => {
    navPill.classList.remove('searching');
    searchInput.value = '';
};

searchInput.onkeypress = (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
            setMode('search', query, `Kết quả tìm kiếm: "${query}"`);
        }
    }
};

document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
        document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
        item.classList.add('active');
        setMode('category', item.dataset.slug, item.innerText);
    };
});

const GENRES = [
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
    const genreContainer = document.getElementById('genresScroll');
    if (!genreContainer) return;
    
    genreContainer.innerHTML = '';
    
    GENRES.forEach((genre) => {
        const pill = document.createElement('div');
        pill.className = 'genre-pill'; 
        pill.innerText = genre.name;
        
        pill.onclick = () => {
            if (isLoading) return;
            document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
            pill.classList.add('active');
            setMode('genre', genre.slug, `Thể Loại: ${genre.name.replace(/[^a-zA-ZÀ-ỹ\s]/g, '').trim()}`);
        };
        
        genreContainer.appendChild(pill);
    });
}

const COUNTRIES = [
    { name: '🇨🇳 Trung Quốc', slug: 'trung-quoc' },
    { name: '🇰🇷 Hàn Quốc', slug: 'han-quoc' },
    { name: '🇯🇵 Nhật Bản', slug: 'nhat-ban' },
    { name: '🇹🇭 Thái Lan', slug: 'thai-lan' },
    { name: '🇺🇸 Âu Mỹ', slug: 'au-my' },
    { name: '🇹🇼 Đài Loan', slug: 'dai-loan' },
    { name: '🇭🇰 Hồng Kông', slug: 'hong-kong' },
    { name: '🇮🇳 Ấn Độ', slug: 'an-do' },
    { name: '🇬🇧 Anh', slug: 'anh' },
    { name: '🇮🇩 Indonesia', slug: 'indonesia' },
    { name: '🇻🇳 Việt Nam', slug: 'viet-nam' }
];

function initCountries() {
    const countryContainer = document.getElementById('countriesScroll');
    if (!countryContainer) return;
    
    countryContainer.innerHTML = '';
    
    COUNTRIES.forEach((country) => {
        const pill = document.createElement('div');
        pill.className = 'genre-pill';
        pill.innerText = country.name;
        
        pill.onclick = () => {
            if (isLoading) return;
            document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
            pill.classList.add('active');
            setMode('country', country.slug, `Quốc Gia: ${country.name.replace(/[^a-zA-ZÀ-ỹ\s]/g, '').trim()}`);
        };
        
        countryContainer.appendChild(pill);
    });
}

const TYPES = [
    { name: '🎬 Phim Bộ', slug: 'phim-bo', mode: 'category' },
    { name: '🎞️ Phim Lẻ', slug: 'phim-le', mode: 'category' },
    { name: '🧸 Hoạt Hình', slug: 'hoat-hinh', mode: 'category' },
    { name: '📺 TV Shows', slug: 'tv-shows', mode: 'category' }
];

function initFilterModal() {
    const modal = document.getElementById('filterModal');
    const btnOpen = document.getElementById('openFilterBtn');
    const btnClose = document.getElementById('closeFilterBtn');
    const btnExecute = document.getElementById('btnExecuteFilter');

    if (!modal || !btnOpen) return;

    btnOpen.onclick = () => modal.classList.add('show');
    btnClose.onclick = () => modal.classList.remove('show');
    modal.onclick = (e) => { if(e.target === modal) modal.classList.remove('show'); }; 

    window.selectedFilters = { type: null, genre: null, country: null };

    function createPills(dataArray, containerId, filterKey) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = '';

        dataArray.forEach(item => {
            const pill = document.createElement('div');
            pill.className = 'genre-pill';
            pill.innerText = item.name;

            pill.onclick = () => {
                container.querySelectorAll('.genre-pill').forEach(p => p.classList.remove('selected'));
                
                if (window.selectedFilters[filterKey] && window.selectedFilters[filterKey].slug === item.slug) {
                    window.selectedFilters[filterKey] = null;
                } else {
                    pill.classList.add('selected');
                    window.selectedFilters[filterKey] = {
                        slug: item.slug,
                        mode: item.mode || (filterKey === 'genre' ? 'genre' : 'country'),
                        name: item.name.replace(/[^a-zA-ZÀ-ỹ0-9\s+]/g, '').trim()
                    };
                }
            };
            container.appendChild(pill);
        });
    }

    createPills(TYPES, 'modalTypes', 'type');
    createPills(GENRES, 'modalGenres', 'genre');
    createPills(COUNTRIES, 'modalCountries', 'country');

    if(btnExecute) {
        btnExecute.onclick = () => {
            modal.classList.remove('show'); 
            
            let callMode = 'new';
            let callSlug = '';
            let titleParts = [];

            if (window.selectedFilters.genre) {
                callMode = 'genre';
                callSlug = window.selectedFilters.genre.slug;
            } else if (window.selectedFilters.country) {
                callMode = 'country';
                callSlug = window.selectedFilters.country.slug;
            } else if (window.selectedFilters.type) {
                callMode = 'category';
                callSlug = window.selectedFilters.type.slug;
            } else {
                setMode('new', '', 'Tớ vừa chôm về');
                return;
            }

            if(window.selectedFilters.type) titleParts.push(window.selectedFilters.type.name);
            if(window.selectedFilters.genre) titleParts.push(window.selectedFilters.genre.name);
            if(window.selectedFilters.country) titleParts.push(window.selectedFilters.country.name);

            document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

            setMode(callMode, callSlug, `Mấy phim mà: ${titleParts.join(' - ')} nè!`, true);
        };
    }
}

function setMode(mode, query, title, isMultiFilter = false) {
    if (isLoading) return;
    if (!isMultiFilter) {
        window.selectedFilters = { type: null, genre: null, country: null };
    }
    currentMode = mode;
    currentQuery = query;
    if (title) sectionTitle.innerText = title;
    displayPage(1);
}

function renderHero(movies) {
    heroGrid.innerHTML = '';
    if (!movies || movies.length < 2) {
        document.querySelector('.hero-section').style.display = 'none';
        return;
    }
    document.querySelector('.hero-section').style.display = 'block';

    const shuffled = [...movies].sort(() => 0.5 - Math.random());
    const top2 = shuffled.slice(0, 2);

    top2.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'hero-card';
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;

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

        let rawScore = 0;
        if (movie.imdb && movie.imdb.vote_average) {
            rawScore = parseFloat(movie.imdb.vote_average);
        } else if (movie.tmdb && movie.tmdb.vote_average) {
            rawScore = parseFloat(movie.tmdb.vote_average);
        }
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';

        let typeText = 'Phim Bộ';
        if (movie.type === 'single') {
            typeText = 'Phim Lẻ';
        }

        card.innerHTML = `
            <div class="thumb-wrapper">
                <img src="${movie.full_thumb}" class="movie-thumb" alt="${movie.name}" loading="lazy">
            </div>
            <h3 class="movie-title">${movie.name}</h3>
            <div class="movie-meta">
                <span class="movie-score">★ ${displayScore}</span>
                <span class="movie-type-badge">${typeText}</span>
            </div>
        `;
        movieGrid.appendChild(card);
    });
}

function renderPagination(currentPage, totalPages) {
    const pagDiv = document.getElementById('pagination');
    pagDiv.innerHTML = '';
    
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '◀️';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => displayPage(currentPage - 1);
    pagDiv.appendChild(prevBtn);

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

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '▶️';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => displayPage(currentPage + 1);
    pagDiv.appendChild(nextBtn);
}

async function displayPage(page) {
    if (isLoading) return;
    isLoading = true;
    
    movieGrid.innerHTML = '<div class="loader-container"><div class="spinner"></div><div class="loader-text">Hơi lâu, chờ xíu 🤭</div></div>';    document.getElementById('pagination').innerHTML = '';

    try {
        const ITEMS_PER_PAGE = 24;
        const CHUNK_SIZE = 6;

        let filterHash = currentMode + '_' + currentQuery;
        let isMultiFiltering = false;
        
        if (window.selectedFilters && (window.selectedFilters.type || window.selectedFilters.country || window.selectedFilters.genre)) {
            isMultiFiltering = true;
            if (window.selectedFilters.type) filterHash += '_t_' + window.selectedFilters.type.slug;
            if (window.selectedFilters.country) filterHash += '_c_' + window.selectedFilters.country.slug;
            if (window.selectedFilters.genre) filterHash += '_g_' + window.selectedFilters.genre.slug;
        }

        if (!window.ffCache || window.ffCache.filterHash !== filterHash) {
            window.ffCache = {
                filterHash: filterHash,
                items: [],             
                lastApiPage: 0,        
                isApiExhausted: false, 
                apiTotalPages: 1
            };
        }

        const LOOKAHEAD_PAGES = 6;
        const requiredItems = (page + LOOKAHEAD_PAGES - 1) * ITEMS_PER_PAGE; 
        
        let loops = 0;
        while (window.ffCache.items.length < requiredItems && !window.ffCache.isApiExhausted && loops < 5) { 
            loops++;
            let chunkItems = [];

            for (let i = 1; i <= CHUNK_SIZE; i++) {
                let apiPageToFetch = window.ffCache.lastApiPage + 1;
                let apiUrl = '';
                
                if (currentMode === 'new') apiUrl = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${apiPageToFetch}`;
                else if (currentMode === 'category') apiUrl = `${API_BASE}/danh-sach/${currentQuery}?page=${apiPageToFetch}`;
                else if (currentMode === 'genre') apiUrl = `${API_BASE}/the-loai/${currentQuery}?page=${apiPageToFetch}`;
                else if (currentMode === 'country') apiUrl = `${API_BASE}/quoc-gia/${currentQuery}?page=${apiPageToFetch}`;
                else if (currentMode === 'search') apiUrl = `${API_BASE}/tim-kiem?keyword=${encodeURIComponent(currentQuery)}&page=${apiPageToFetch}`;

                const res = await fetch(apiUrl, fetchOptions);
                const json = await res.json();
                const dataObj = json.data || json;
                const items = dataObj.items || json.items || [];

                if (window.ffCache.lastApiPage === 0) {
                    if (dataObj.params && dataObj.params.pagination) {
                        window.ffCache.apiTotalPages = dataObj.params.pagination.totalPages || Math.ceil(dataObj.params.pagination.totalItems / dataObj.params.pagination.totalItemsPerPage) || 1;
                    } else if (dataObj.pagination) {
                        window.ffCache.apiTotalPages = dataObj.pagination.totalPages || 1;
                    }
                    if (window.ffCache.apiTotalPages === 1 && items.length >= 24) window.ffCache.apiTotalPages = 999; 
                }

                if (items.length === 0) {
                    window.ffCache.isApiExhausted = true;
                    break;
                }

                let imgDomain = (dataObj.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live').replace(/\/$/, ''); 
                let isMobile = window.innerWidth <= 480;
                let tempFiltered = items.map(m => {
                    let thumb = m.thumb_url || m.poster_url || '';
                    let rawUrl = '';
                    if (!thumb.startsWith('http')) {
                        if (!thumb.includes('uploads/movies/')) thumb = '/uploads/movies/' + thumb.replace(/^\//, '');
                        else if (!thumb.startsWith('/')) thumb = '/' + thumb;
                        rawUrl = imgDomain + thumb;
                    } else {
                        rawUrl = thumb;
                    }
                    if (isMobile) {
                        m.full_thumb = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=250&q=65&output=webp`;
                    } else {
                        m.full_thumb = rawUrl;
                    }

                });

                if (window.selectedFilters.type && currentMode !== 'category') {
                        const tSlug = window.selectedFilters.type.slug;
                        let apiType = '';
                        if (tSlug === 'phim-le') apiType = 'single';
                        else if (tSlug === 'phim-bo') apiType = 'series';
                        else if (tSlug === 'hoat-hinh') apiType = 'hoathinh';
                        else if (tSlug === 'tv-shows') apiType = 'tvshows';
                        if (apiType) tempFiltered = tempFiltered.filter(m => m.type === apiType);
                    }
                    if (window.selectedFilters.country && currentMode !== 'country') {
                        tempFiltered = tempFiltered.filter(m => m.country && m.country.some(c => c.slug === window.selectedFilters.country.slug));
                    }
                    if (window.selectedFilters.genre && currentMode !== 'genre') {
                        tempFiltered = tempFiltered.filter(m => m.category && m.category.some(c => c.slug === window.selectedFilters.genre.slug));
                    }
                }

                chunkItems = chunkItems.concat(tempFiltered);
                window.ffCache.lastApiPage = apiPageToFetch; 
            }
            
            window.ffCache.items = window.ffCache.items.concat(chunkItems);
        }

        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const finalItems = window.ffCache.items.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        let displayTotalPages = 1;
        if (!isMultiFiltering) {
            displayTotalPages = window.ffCache.apiTotalPages;
        } else {
            displayTotalPages = Math.ceil(window.ffCache.items.length / ITEMS_PER_PAGE);
        }
        if(displayTotalPages < 1) displayTotalPages = 1;

        if (finalItems.length > 0) {
            if (currentMode === 'new' && page === 1 && !isHeroRendered) {
                renderHero(finalItems); 
                isHeroRendered = true;
            } else if (currentMode !== 'new') {
                document.querySelector('.hero-section').style.display = 'none';
            } else {
                document.querySelector('.hero-section').style.display = 'block';
            }

            renderMoviesGrid(finalItems); 
            renderPagination(page, displayTotalPages);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            renderMoviesGrid([]);
            renderPagination(page, displayTotalPages); 
        }

    } catch (error) { 
        console.error(error); 
        renderMoviesGrid([]); 
    }
    isLoading = false;
}

initGenres();
initCountries();
initFilterModal();

const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('search');
const categoryQuery = urlParams.get('category');
const titleQuery = urlParams.get('title');

if (searchQuery) {
    setMode('search', searchQuery, `Kết quả tìm kiếm: "${searchQuery}"`);
} else if (categoryQuery) {
    document.querySelectorAll('.nav-item, .genre-pill').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => {
        if(item.dataset.slug === categoryQuery) {
            item.classList.add('active');
        }
    });
    setMode('category', categoryQuery, titleQuery);
} else {
    setMode('new', '', 'Tớ vừa chôm về');
}