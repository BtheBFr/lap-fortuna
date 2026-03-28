// config.js - Настройки подключения к Google Sheets
const GOOGLE_SHEETS_API_URL = "https://script.google.com/macros/s/AKfycbzptLcgChLB-td8KkhqC1j00PC0rWvf5GkAYEieVdfAYZAd3UHZVK_rk3p3M7t8qdgo/exec";

// Экспортируем для использования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GOOGLE_SHEETS_API_URL };
}
