console.log("页面已缓存");



// 批量加载所有css
const cssList = [
"srk.css",
    "reset.css",
    "style.css",
    "mobile.css",
    "hr.css",
    "h.css",
    "xhx.css",
    "img.css",
    "zd.css",
    "bj2.css",
    "p.css"
];
cssList.forEach(href=>{
    let link = document.createElement('link');
    link.rel = "stylesheet";
    link.href = "/a/js/" + href;
    link.onload = ()=>{};
    link.onerror = ()=>{};
    document.head.appendChild(link);
});






// 【1】DOMContentLoaded 加载 yj.html 页脚：优先远程，失败自动切本地
window.addEventListener('DOMContentLoaded', function() {
    function loadHtml(url, fallbackUrl) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        // 超时 3 秒，超时也算失败切本地
        xhr.timeout = 3000;
        xhr.onreadystatechange = function() {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    document.body.insertAdjacentHTML('beforeend', xhr.responseText);
                } else if (fallbackUrl) {
                    // 远程失败，加载本地，不再二次 fallback
                    loadHtml(fallbackUrl, null);
                }
            }
        };
        xhr.ontimeout = function() {
            if (fallbackUrl) loadHtml(fallbackUrl, null);
        };
        xhr.onerror = function() {
            if (fallbackUrl) loadHtml(fallbackUrl, null);
        };
        xhr.send();
    }
    // 优先远程，失败切本地
    loadHtml('https://wangshangyonghu.github.io/erp/yj.html', '/erp/yj.html');
});



