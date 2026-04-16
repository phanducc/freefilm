/**
 * js/ui.js
 * File này đóng vai trò như "họa sĩ", chuyên nhận dữ liệu và vẽ HTML ra màn hình.
 */

// Hàm vẽ danh sách phim (Grid)
export function renderMoviesGrid(movies, containerId) {
    const movieGrid = document.getElementById(containerId);
    if (!movieGrid) return; // Nếu không tìm thấy vùng chứa trên HTML thì dừng lại
    
    movieGrid.innerHTML = '';
    
    // Nếu không có phim nào, hiển thị câu thông báo
    if (!movies || movies.length === 0) {
        movieGrid.innerHTML = '<p style="color:#aaa; text-align:center; grid-column:1/-1;">Không tìm thấy dữ liệu.</p>';
        return;
    }

    // Duyệt qua từng phim và tạo thẻ HTML
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

// Hàm vẽ 2 phim nổi bật ở khu vực Hero (Banner)
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

    // Trộn ngẫu nhiên phim và lấy 2 phim đầu tiên
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

// Hàm vẽ thanh phân trang (1, 2, 3... Next)
export function renderPagination(currentPage, totalPages, containerId, onPageClick) {
    const pagDiv = document.getElementById(containerId);
    if (!pagDiv) return;
    
    pagDiv.innerHTML = '';
    if (totalPages <= 1) return;

    // Nút lùi lại
    const prevBtn = document.createElement('button');
    prevBtn.className = 'page-btn';
    prevBtn.innerText = '◀️';
    prevBtn.disabled = currentPage === 1;
    prevBtn.onclick = () => onPageClick(currentPage - 1); // Gọi hàm được truyền vào
    pagDiv.appendChild(prevBtn);

    // Tính toán số trang cần hiển thị (thêm dấu 3 chấm nếu nhiều trang)
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

    // Vẽ các nút số trang
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
            btn.onclick = () => { if (p !== currentPage) onPageClick(p); }; // Gọi hàm được truyền vào
            pagDiv.appendChild(btn);
        }
    });

    // Nút tiến lên
    const nextBtn = document.createElement('button');
    nextBtn.className = 'page-btn';
    nextBtn.innerText = '▶️';
    nextBtn.disabled = currentPage >= totalPages;
    nextBtn.onclick = () => onPageClick(currentPage + 1); // Gọi hàm được truyền vào
    pagDiv.appendChild(nextBtn);
}