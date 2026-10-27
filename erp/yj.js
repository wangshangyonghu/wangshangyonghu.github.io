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




// DOMContentLoaded 加载 yj.html 页脚
window.addEventListener('DOMContentLoaded', function() {
    var xhr1 = new XMLHttpRequest();
    xhr1.open('GET', 'yj.html', true);
    xhr1.onreadystatechange = function() {
        if (xhr1.readyState === 4 && xhr1.status === 200) {
            document.body.insertAdjacentHTML('beforeend', xhr1.responseText);
        }
    };
    xhr1.send();
});


