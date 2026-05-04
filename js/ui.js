export function initSmartHeader() {
    let lastScrollTop = 0;
    const header = document.querySelector('.glass-header');

    if (!header) return;

    window.addEventListener('scroll', () => {
        let scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        if (scrollTop > lastScrollTop && scrollTop > 80) {
            header.classList.add('hide');
        } else {
            header.classList.remove('hide');
        }
        
        lastScrollTop = scrollTop <= 0 ? 0 : scrollTop; 
    }, { passive: true });
}

export function renderMoviesGrid(movies, containerId) {
    const movieGrid = document.getElementById(containerId);
    if (!movieGrid) return;
    
    movieGrid.innerHTML = '';
    
    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = '<p style="color:#aaa; text-align:center; grid-column:1/-1;">oh noo, lỗi rồi 🤭</p>';
        return;
    }

    movies.forEach(movie => {
        const card = document.createElement('div');
        card.className = 'movie-card';
        card.onclick = () => window.location.href = `watch.html?slug=${movie.slug}`;

        let rawScore = parseFloat(movie.imdb?.vote_average || movie.tmdb?.vote_average || 0);
        let displayScore = (rawScore > 0) ? rawScore.toFixed(1) : 'N/A';

        let typeText = 'Phim Bộ'; 
        if (movie.tmdb && movie.tmdb.type) {
            typeText = movie.tmdb.type === 'movie' ? 'Phim Lẻ' : 'Phim Bộ';
        } else if (movie.type === 'single') {
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

export function renderHero(movies, containerId) {
    const heroGrid = document.getElementById(containerId);
    if (!heroGrid) return;
    
    heroGrid.innerHTML = '';
    const heroSection = document.querySelector('.hero-section');
    
    if (!movies || movies.length < 2) {
        if (heroSection) heroSection.style.display = 'none';
        return;
    }
    
    if (heroSection) heroSection.style.display = 'block';

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

export function renderContinueWatching() {
    let item = null;
    try {
        const storedData = localStorage.getItem('ff_last_watched');
        if (storedData) item = JSON.parse(storedData);
    } catch (error) {
        console.error("Dữ liệu lịch sử xem bị hỏng:", error);
        localStorage.removeItem('ff_last_watched');
    }

    if (!item) return;

    let block = document.getElementById('continueWatchingBlock');
    if (!block) {
        block = document.createElement('div');
        block.id = 'continueWatchingBlock';
        
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.parentNode.insertBefore(block, heroSection.nextSibling);
        }
    }

    block.innerHTML = `
        <div class="cw-banner" onclick="window.location.href='watch.html?slug=${item.slug}'">
            <div class="cw-info-wrapper">
                <img src="${item.thumb}" class="cw-thumb" alt="${item.name}">
                <div class="cw-text">
                    <h3 class="cw-title">${item.name}</h3>
                    <span class="cw-ep">⏱️ Xem tiếp... ${item.epName}</span>
                </div>
            </div>

            <div class="cw-btn-wrapper">
                <button class="cw-btn">▶ Phát tiếp</button>
            </div>
        </div>
    `;
}

export function renderPagination(currentPage, totalPages, containerId, onPageClick) {
    const pagDiv = document.getElementById(containerId);
    if (!pagDiv) return;
    
    pagDiv.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '◀️';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageClick(currentPage - 1);
    pagDiv.appendChild(prevBtn);

    let pages = [];
    if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
        if (currentPage <= 3) {
            pages = [1, 2, 3, 4, 5, '...'];
        } else if (currentPage >= totalPages - 2) {
            pages = [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
        } else {
            pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
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
            btn.onclick = () => { if (p !== currentPage) onPageClick(p); };
            pagDiv.appendChild(btn);
        }
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '▶️';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => onPageClick(currentPage + 1);
    pagDiv.appendChild(nextBtn);
}