export const API_BASE = 'https://ophim1.com/v1/api';
export const fetchOptions = { method: 'GET', headers: { accept: 'application/json' } };

export const GENRES = [
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

export const COUNTRIES = [
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

export const TYPES = [
    { name: '🎬 Phim Bộ', slug: 'phim-bo', mode: 'category' },
    { name: '🎞️ Phim Lẻ', slug: 'phim-le', mode: 'category' },
    { name: '🧸 Hoạt Hình', slug: 'hoat-hinh', mode: 'category' },
    { name: '📺 TV Shows', slug: 'tv-shows', mode: 'category' }
];