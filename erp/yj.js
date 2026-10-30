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

// 串行加载JS，保证加载顺序，增加onerror容错，单个js404不会阻塞后续脚本
const jsList = [
    "tj.js",
    "srk.js",
    
    "imgmodal.js",
    "",
    "dns.js",
    "a.js",
    "sl1.js",
    "sxy.js",
    "tel.js",
    "title.js",
    "ewm.js",
    "zd.js"
];
function loadScripts(scriptArray, index = 0) {
    if (index >= scriptArray.length) return;
    let s = document.createElement('script');
    s.src = "/a/js/" + scriptArray[index];
    s.onload = () => loadScripts(scriptArray, index + 1);
    s.onerror = () => loadScripts(scriptArray, index + 1);
    document.head.appendChild(s);
}
loadScripts(jsList);



window.addEventListener('DOMContentLoaded', function() {
    var xhr1 = new XMLHttpRequest();
    xhr1.open('GET', 'https://cdn.jsdelivr.net/gh/wangshangyonghu/erp@main/yj.html', true);
    xhr1.onreadystatechange = function() {
        if (xhr1.readyState === 4 && xhr1.status === 200) {
            document.body.insertAdjacentHTML('beforeend', xhr1.responseText);
        }
    };
    xhr1.send();
});

