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
    const history = JSON.parse(localStorage.getItem('ff_history_list') || '[]');
    if (history.length === 0) return;

    const item = history[0]; 

    let block = document.getElementById('continueWatchingBlock');
    if (!block) {
        block = document.createElement('div');
        block.id = 'continueWatchingBlock';
        block.style.margin = '20px 0 10px 0';
        block.style.padding = '0 10px';
        
        const heroSection = document.querySelector('.hero-section');
        if (heroSection) {
            heroSection.parentNode.insertBefore(block, heroSection.nextSibling);
        }
    }

    block.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; height: 80px; background: rgba(255, 117, 160, 0.15); border: 1px solid #ff75a080; border-radius: 16px; padding: 10px; cursor: pointer; transition: 0.3s; box-sizing: border-box;" 
             onclick="window.location.href='watch.html?slug=${item.slug}'"
             onmouseover="this.style.background='rgba(255, 117, 160, 0.3)'"
             onmouseout="this.style.background='rgba(255, 117, 160, 0.15)'">
            
            <div style="display: flex; align-items: center; gap: 15px; height: 100%; overflow: hidden; flex: 1;">
                <img src="${item.thumb}" style="height: 100%; aspect-ratio: 16/9; object-fit: cover; border-radius: 8px; border: 1px solid #fbcbdf50;">
                <div style="display: flex; flex-direction: column; justify-content: center; overflow: hidden;">
                    <h3 style="font-size: 15px; font-weight: 800; color: #fbcbdf; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${item.name}</h3>
                    <span style="font-size: 12px; color: #ff75a0; font-weight: 600; margin-top: 4px;">⏱️ Đang xem dở: ${item.epName}</span>
                </div>
            </div>

            <div style="margin-left: 10px; flex-shrink: 0;">
                <button style="background: #ff75a0; color: #000; border: none; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 800; cursor: pointer; display: flex; align-items: center; gap: 5px;">
                    ▶ Phát tiếp
                </button>
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