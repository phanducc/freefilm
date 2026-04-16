import { GENRES, COUNTRIES, TYPES } from './constants.js';
import { renderMoviesGrid, renderHero, renderPagination } from './ui.js';
import { fetchMoviesFromApi } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const intro = document.getElementById('siteIntro');
    if (intro) {
        if (!sessionStorage.getItem('introPlayed')) {
            const hideIntro = () => {
                intro.classList.add('hidden');
                sessionStorage.setItem('introPlayed', 'true');
                setTimeout(() => intro.remove(), 800); 
            };
            setTimeout(hideIntro, 2000);
        } else {
            intro.style.display = 'none';
            intro.remove();
        }
    }
});

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
                callMode = 'genre'; callSlug = window.selectedFilters.genre.slug;
            } else if (window.selectedFilters.country) {
                callMode = 'country'; callSlug = window.selectedFilters.country.slug;
            } else if (window.selectedFilters.type) {
                callMode = 'category'; callSlug = window.selectedFilters.type.slug;
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
    if (title && sectionTitle) sectionTitle.innerText = title;
    displayPage(1);
}

async function displayPage(page) {
    if (isLoading) return;
    isLoading = true;
    
    const movieGridEl = document.getElementById('movieGrid');
    movieGridEl.innerHTML = '<div class="loader-container"><div class="spinner"></div><div class="loader-text">Hơi lâu, chờ xíu nha 🤭</div></div>';    
    document.getElementById('pagination').innerHTML = '';

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
            window.ffCache = { filterHash: filterHash, items: [], lastApiPage: 0, isApiExhausted: false, apiTotalPages: 1 };
        }

        const LOOKAHEAD_PAGES = 6;
        const requiredItems = (page + LOOKAHEAD_PAGES - 1) * ITEMS_PER_PAGE; 
        
        let loops = 0;
        while (window.ffCache.items.length < requiredItems && !window.ffCache.isApiExhausted && loops < 5) { 
            loops++;
            let chunkItems = [];

            for (let i = 1; i <= CHUNK_SIZE; i++) {
                let apiPageToFetch = window.ffCache.lastApiPage + 1;
                
                const { items, totalPages } = await fetchMoviesFromApi(currentMode, currentQuery, apiPageToFetch);

                if (window.ffCache.lastApiPage === 0) {
                    window.ffCache.apiTotalPages = totalPages;
                }

                if (items.length === 0) {
                    window.ffCache.isApiExhausted = true;
                    break;
                }

                let tempFiltered = items;

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
                renderHero(finalItems, 'heroGrid'); 
                isHeroRendered = true;
            } else if (currentMode !== 'new') {
                document.querySelector('.hero-section').style.display = 'none';
            } else {
                document.querySelector('.hero-section').style.display = 'block';
            }

            renderMoviesGrid(finalItems, 'movieGrid'); 
            renderPagination(page, displayTotalPages, 'pagination', displayPage); 
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
            renderMoviesGrid([], 'movieGrid');
            renderPagination(page, displayTotalPages, 'pagination', displayPage); 
        }

    } catch (error) { 
        console.error(error); 
        renderMoviesGrid([], 'movieGrid'); 
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