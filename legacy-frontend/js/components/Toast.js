export function showToast(message, type = 'info') {
    const toast = document.getElementById('grammarToast');
    toast.textContent = message;
    toast.className = `toast show toast--${type}`;

    // 3초 후 토스트 숨기기
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
} 