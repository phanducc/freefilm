/**
 * js/api.js
 * Chịu trách nhiệm giao tiếp với máy chủ (gọi API) để tải dữ liệu phim và xử lý hình ảnh.
 */

// Nhập các hằng số từ nhà kho
import { API_BASE, fetchOptions } from './constants.js';

// Hàm lấy dữ liệu phim từ API
export async function fetchMoviesFromApi(mode, query, apiPageToFetch) {
    let apiUrl = '';
    
    // 1. Tạo đường dẫn API tùy theo chế độ (mới cập nhật, thể loại, quốc gia, tìm kiếm...)
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
        // 2. Tiến hành gọi API
        const res = await fetch(apiUrl, fetchOptions);
        const json = await res.json();
        
        const dataObj = json.data || json;
        const items = dataObj.items || json.items || [];
        
        // 3. Tính toán tổng số trang của API
        let apiTotalPages = 1;
        if (dataObj.params && dataObj.params.pagination) {
            apiTotalPages = dataObj.params.pagination.totalPages || Math.ceil(dataObj.params.pagination.totalItems / dataObj.params.pagination.totalItemsPerPage) || 1;
        } else if (dataObj.pagination) {
            apiTotalPages = dataObj.pagination.totalPages || 1;
        }
        
        // Mẹo: Nếu trang mới cập nhật báo 1 trang nhưng có tới 24 phim, ta tự cho max trang là 999
        if (apiTotalPages === 1 && items.length >= 24) apiTotalPages = 999; 

        // 4. Xử lý đường dẫn hình ảnh (thêm tên miền, tối ưu ảnh cho điện thoại)
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
            
            // Tối ưu ảnh qua wsrv.nl nếu là Mobile giúp load nhanh hơn
            if (isMobile) {
                m.full_thumb = `https://wsrv.nl/?url=${encodeURIComponent(rawUrl)}&w=250&q=65&output=webp`;
            } else {
                m.full_thumb = rawUrl;
            }

            return m;
        });

        // Trả kết quả sạch sẽ về
        return {
            items: formattedItems,
            totalPages: apiTotalPages
        };

    } catch (error) {
        console.error('Lỗi khi gọi API:', error);
        return { items: [], totalPages: 1 }; // Trả về mảng rỗng nếu lỗi
    }
}