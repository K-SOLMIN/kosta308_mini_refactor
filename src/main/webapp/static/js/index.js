// 로그인 폼 엔터키 제출
document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    if (!form) return;

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') form.submit();
    });
});
