import { API_BASE, fetchOptions } from './constants.js';

export async function fetchMoviesFromApi(mode, query, apiPageToFetch) {
    let apiUrl = '';
    
    if (mode === 'new') {
        apiUrl = `${API_BASE}/danh-sach/phim-moi-cap-nhat?page=${apiPageToFetch}`;
    } else if (mode === 'category') {
        apiUrl = `${API_BASE}/danh-sach/${query}?page=${apiPageToFetch}`;
    } else if (mode === 'genre') {
        apiUrl = `${API_BASE}/the-loai/${query}?page=${apiPageToFetch}`;
    } else if (mode === 'country') {
        apiUrl = `${API_BASE}/quoc-gia/${query}?page=${apiPageToFetch}`;
    } else if (mode === 'search') {
        apiUrl = `${API_BASE}/tim-kiem?keyword=${encodeURIComponent(query)}&page=${apiPageToFetch}`;
    }

    try {
        const res = await fetch(apiUrl, fetchOptions);
        const json = await res.json();
        
        const dataObj = json.data || json;
        const items = dataObj.items || json.items || [];
        
        let apiTotalPages = 1;
        if (dataObj.params && dataObj.params.pagination) {
            apiTotalPages = dataObj.params.pagination.totalPages || Math.ceil(dataObj.params.pagination.totalItems / dataObj.params.pagination.totalItemsPerPage) || 1;
        } else if (dataObj.pagination) {
            apiTotalPages = dataObj.pagination.totalPages || 1;
        }
        
        if (apiTotalPages === 1 && items.length >= 24) apiTotalPages = 999; 

        let imgDomain = (dataObj.APP_DOMAIN_CDN_IMAGE || 'https://img.ophim.live').replace(/\/$/, ''); 
        let isMobile = window.innerWidth <= 480;
        
        const formattedItems = items.map(m => {
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

            return m;
        });

        return {
            items: formattedItems,
            totalPages: apiTotalPages
        };

    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return { items: [], totalPages: 1 };
    }
}