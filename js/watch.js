import { API_BASE, fetchOptions } from './constants.js';
import { renderMoviesGrid, initSmartHeader } from './ui.js';

initSmartHeader();

const slug = new URLSearchParams(window.location.search).get('slug');
const iframePlayer = document.getElementById('iframePlayer');
const episodeListDiv = document.getElementById('episodeList');
const serverListDiv = document.getElementById('serverList');

let currentEpList = [];
let currentEpIndex = 0;
let movieTrailerUrl = '';
let currentMovieName = '';
let currentMovieThumb = '';

const navPill = document.getElementById('navPill');
const searchToggleBtn = document.getElementById('searchToggleBtn');
const closeSearchBtn = document.getElementById('closeSearchBtn');
const searchInput = document.getElementById('searchInput');

if (searchToggleBtn && closeSearchBtn && navPill && searchInput) {
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
                window.location.href = `index.html?search=${encodeURIComponent(query)}`;
            }
        }
    };
}

document.querySelectorAll('.nav-item').forEach(item => {
    item.onclick = () => {
        const catSlug = item.dataset.slug;
        const title = item.innerText;
        window.location.href = `index.html?category=${catSlug}&title=${encodeURIComponent(title)}`;
    };
});

const trailerModal = document.getElementById('trailerModal');
const trailerIframe = document.getElementById('trailerIframe');

document.getElementById('btnTrailer').onclick = () => {
    if (movieTrailerUrl) {
        let embedUrl = movieTrailerUrl;
        if (embedUrl.includes('watch?v=')) embedUrl = embedUrl.replace('watch?v=', 'embed/');
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1';
        trailerIframe.src = embedUrl;
        trailerModal.classList.add('show');
    } else {
        alert('Phim này chưa có Trailer!');
    }
};

document.getElementById('closeTrailerBtn').onclick = () => {
    trailerModal.classList.remove('show');
    trailerIframe.src = ''; 
};

const videoElement = document.getElementById('myPlayer');
const player = new Plyr(videoElement, {
    controls: ['play-large', 'rewind', 'play', 'fast-forward', 'progress', 'current-time', 'duration', 'settings', 'pip', 'airplay', 'fullscreen'],
    seekTime: 10,
    i18n: { 
        speed: 'Tốc độ', quality: 'Chất lượng', normal: 'Bình thường', rewind: 'Tua lại 10s', fastForward: 'Tua tới 10s',
        settings: 'Cài đặt', pip: 'Hình trong hình', enterFullscreen: 'Toàn màn hình', exitFullscreen: 'Thoát toàn màn hình',
        play: 'Phát', pause: 'Tạm dừng'
    }
});

let hls = null;

player.on('ready', () => {
    const plyrContainer = document.querySelector('.plyr');
    if (plyrContainer && !document.querySelector('.plyr-logo')) {
        const logoImg = document.createElement('img');
        logoImg.src = 'logo.png'; 
        logoImg.alt = 'FreeFilm Watermark';
        logoImg.className = 'plyr-logo';
        plyrContainer.appendChild(logoImg);
    }
});

let lastSaveTime = 0;
function updateHistoryList(time) {
    if (!currentMovieName) return;
    
    const history = [{
        slug: slug,
        name: currentMovieName,
        thumb: currentMovieThumb,
        epName: currentEpList[currentEpIndex]?.name || '',
        time: time
    }];
    
    localStorage.setItem('ff_history_list', JSON.stringify(history));
}

player.on('timeupdate', () => {
    if (player.currentTime > 5) {
        localStorage.setItem(`ff_time_${slug}`, player.currentTime);
        if (Math.abs(player.currentTime - lastSaveTime) > 5) {
            updateHistoryList(player.currentTime);
            lastSaveTime = player.currentTime;
        }
    }
});

function playVideo(index, buttonEl) {
    currentEpIndex = index;
    const epData = currentEpList[index];
    const fallback = document.querySelector('.iframe-fallback');
    const plyrWrapper = document.querySelector('.plyr');

    if (epData.link_m3u8) {
        iframePlayer.style.display = 'none';
        fallback.style.display = 'none';
        plyrWrapper.style.display = 'block';
        videoElement.style.display = 'block';
        iframePlayer.src = 'about:blank';

        if (Hls.isSupported()) {
            if (hls) hls.destroy();
            hls = new Hls();
            hls.loadSource(epData.link_m3u8);
            hls.attachMedia(videoElement);
            hls.on(Hls.Events.MANIFEST_PARSED, () => {
                videoElement.play().catch(() => {});
            });
        } else if (videoElement.canPlayType('application/vnd.apple.mpegurl')) {
            videoElement.src = epData.link_m3u8;
            videoElement.play();
        }
        localStorage.setItem(`ff_history_${slug}`, epData.link_m3u8);
    } 
    else {
        player.pause();
        plyrWrapper.style.display = 'none';
        videoElement.style.display = 'none';
        iframePlayer.style.display = 'block';
        fallback.style.display = 'flex';
        
        iframePlayer.src = epData.link_embed;
        iframePlayer.onload = () => { fallback.style.display = 'none'; };
        localStorage.setItem(`ff_history_${slug}`, epData.link_embed);
    }
    
    updateHistoryList(0);

    episodeListDiv.querySelectorAll('.ep-btn').forEach(b => b.classList.remove('active'));
    if(buttonEl) buttonEl.classList.add('active');

    document.getElementById('btnPrevEp').disabled = (index === 0);
    document.getElementById('btnNextEp').disabled = (index === currentEpList.length - 1);
}

document.getElementById('btnPrevEp').onclick = () => { 
    if(currentEpIndex > 0) playVideo(currentEpIndex - 1, episodeListDiv.children[currentEpIndex - 1]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.getElementById('btnNextEp').onclick = () => { 
    if(currentEpIndex < currentEpList.length - 1) playVideo(currentEpIndex + 1, episodeListDiv.children[currentEpIndex + 1]); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

document.getElementById('btnReload').onclick = () => { 
    const targetBtn = episodeListDiv.children[currentEpIndex];
    if (targetBtn) playVideo(currentEpIndex, targetBtn);
};

async function fetchRelatedMovies(catSlug) {
    try {
        const res = await fetch(`${API_BASE}/the-loai/${catSlug}?page=1`, fetchOptions).then(r => r.json());
        let items = res.data?.items || res.items || [];
        
        let related = items.filter(m => m.slug !== slug);
        related = related.sort(() => 0.5 - Math.random()).slice(0, 6);
        
        let imgDomain = (res.data?.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live').replace(/\/$/, '');
        related = related.map(m => {
            let thumb = m.thumb_url || m.poster_url || '';
            if (!thumb.startsWith('http')) {
                if (!thumb.includes('uploads/movies/')) thumb = '/uploads/movies/' + thumb.replace(/^\//, '');
                else if (!thumb.startsWith('/')) thumb = '/' + thumb;
                thumb = imgDomain + thumb;
            }
            m.full_thumb = window.innerWidth <= 480 ? `https://wsrv.nl/?url=${encodeURIComponent(thumb)}&w=200&q=65&output=webp` : thumb;
            return m;
        });

        renderMoviesGrid(related, 'relatedMoviesGrid');
    } catch(e) { console.error(e); }
}

async function fetchDetail() {
    if (!slug) { 
        document.getElementById('movieTitle').innerText = "Lỗi đường dẫn!"; 
        return; 
    }
    try {
        const resPhim = await fetch(`${API_BASE}/phim/${slug}`, fetchOptions).then(r => r.json());
        const dataObj = resPhim.data || resPhim;
        const movie = dataObj.item || dataObj.movie;

        if (movie) {
            document.title = `Đang xem: ${movie.name}`;
            document.getElementById('movieTitle').innerText = movie.name;
            currentMovieName = movie.name; 
            currentMovieThumb = detailThumb; 

            let imgDomain = (dataObj.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live').replace(/\/$/, '');
            let detailThumb = movie.thumb_url || movie.poster_url || '';
            if (!detailThumb.startsWith('http')) {
                if (!detailThumb.includes('uploads/movies/')) detailThumb = '/uploads/movies/' + detailThumb.replace(/^\//, '');
                else if (!detailThumb.startsWith('/')) detailThumb = '/' + detailThumb;
                detailThumb = imgDomain + detailThumb;
            }
            if (window.innerWidth <= 768 && detailThumb !== '') detailThumb = `https://wsrv.nl/?url=${encodeURIComponent(detailThumb)}&w=300&q=70&output=webp`;
            document.getElementById('movieDetailThumb').src = detailThumb;
            
            movieTrailerUrl = movie.trailer_url || '';

            let rawScore = parseFloat(movie.imdb?.vote_average || movie.tmdb?.vote_average || 0);
            document.getElementById('movieTmdbScore').innerText = `⭐ Điểm đánh giá: ${(rawScore > 0) ? rawScore.toFixed(1) : 'Chưa có'}`;

            document.getElementById('movieMetaInfo').innerHTML = `
                <div><span>🎬 Đạo diễn:</span> ${movie.director?.[0] || 'Đang cập nhật'}</div>
                <div><span>🌍 Quốc gia:</span> ${movie.country?.[0]?.name || 'Đang cập nhật'}</div>
                <div><span>📅 Phát hành:</span> ${movie.year || 'Đang cập nhật'}</div>
                <div><span>⏳ Thời lượng:</span> ${movie.time || 'Đang cập nhật'}</div>
                <div><span>📺 Tiến độ:</span> ${movie.episode_current || '?'} / ${movie.episode_total || '?'}</div>
                <div><span>✨ Định dạng:</span> ${movie.quality || ''} ${movie.lang ? '- ' + movie.lang : ''}</div>
            `;
            document.getElementById('movieDesc').innerHTML = movie.content || "Chưa có mô tả chi tiết.";

            let episodesArray = movie.episodes || resPhim.episodes;
            if (episodesArray && episodesArray.length > 0) {
                let newServers = [];
                episodesArray.forEach(server => {
                    let typeName = server.server_name.toLowerCase().includes('thuyết minh') ? 'Thuyết Minh' : 'Vietsub';
                    newServers.push({ server_name: `SV1 ${typeName}`, server_data: server.server_data.map(ep => ({ name: ep.name, link_embed: "", link_m3u8: ep.link_m3u8 })) });
                    newServers.push({ server_name: `SV2 ${typeName}`, server_data: server.server_data.map(ep => ({ name: ep.name, link_embed: ep.link_embed, link_m3u8: "" })) });
                });
                episodesArray = newServers; 
            }

            if (!episodesArray || episodesArray.length === 0) { 
                episodeListDiv.innerHTML = '<p>Chưa cập nhật link xem.</p>'; 
            } else {
                function renderEpisodes(serverIndex) {
                    episodeListDiv.innerHTML = '';
                    currentEpList = episodesArray[serverIndex].server_data || [];
                    const savedEp = localStorage.getItem(`ff_history_${slug}`);

                    currentEpList.forEach((tap, i) => {
                        const btn = document.createElement('button');
                        btn.className = 'ep-btn'; 
                        btn.innerText = tap.name || `Tập ${i + 1}`;
                        btn.onclick = () => { playVideo(i, btn); window.scrollTo({ top: 0, behavior: 'smooth' }); };
                        episodeListDiv.appendChild(btn);
                    });
                    
                    let targetIndex = currentEpIndex >= currentEpList.length ? 0 : currentEpIndex;
                    let historyIndex = currentEpList.findIndex(tap => savedEp && (tap.link_embed === savedEp || tap.link_m3u8 === savedEp));
                    if (historyIndex !== -1) targetIndex = historyIndex;
                    
                    const targetBtn = episodeListDiv.children[targetIndex];
                    if (targetBtn) playVideo(targetIndex, targetBtn);
                }

                document.getElementById('serverSection').style.display = 'block';
                episodesArray.forEach((server, i) => {
                    const btn = document.createElement('button');
                    btn.className = 'ep-btn'; 
                    btn.innerText = server.server_name || `Server ${i + 1}`;
                    btn.onclick = () => {
                        serverListDiv.querySelectorAll('button').forEach(b => { b.classList.remove('active'); b.style.background = ''; b.style.color = ''; });
                        btn.classList.add('active');
                        renderEpisodes(i);
                    };
                    serverListDiv.appendChild(btn);
                    if(i===0) btn.click();
                });
            }

            if(movie.category && movie.category.length > 0) fetchRelatedMovies(movie.category[0].slug);

            const resPeoples = await fetch(`${API_BASE}/phim/${slug}/peoples`, fetchOptions).then(r => r.json()).catch(()=>null);
            const actorsList = document.getElementById('actorsList');
            actorsList.innerHTML = '';
            if (resPeoples?.data?.peoples?.length > 0) {
                let actorsHtml = '';
                resPeoples.data.peoples.slice(0, 27).forEach(actor => {
                    actorsHtml += `
                        <div class="actor-card">
                            ${actor.profile_path ? `<img src="https://image.tmdb.org/t/p/w185${actor.profile_path}" class="actor-img">` : `<div class="actor-img" style="display:flex; align-items:center; justify-content:center; font-size: 45px; background:#fbcbdf;">🤹</div>`}
                            <div class="actor-name">${actor.name}</div>
                        </div>
                    `;
                });
                actorsList.innerHTML = actorsHtml;
            } else { actorsList.innerHTML = '<span style="color:#aaa;">Đang cập nhật...</span>'; }
        } else {
            document.title = "Không tìm thấy phim";
            document.getElementById('movieTitle').innerText = "Phim không tồn tại hoặc đã bị xóa 🥲";
            document.getElementById('movieDesc').innerHTML = "Vui lòng quay lại trang chủ và chọn phim khác nhé!";
            document.getElementById('serverSection').style.display = 'none';
            document.querySelector('.player-wrapper').style.display = 'none';
        }
    } catch (error) { console.error(error); }
}

fetchDetail();