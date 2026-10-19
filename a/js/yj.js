// 批量加载所有css
const cssList = [
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


// 【3】DOMContentLoaded 修改页面标题追加 @网上用户 独立代码
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function(){
        const suffix = '@网上用户';
        let title = document.title.trim();
        if(!title.endsWith(suffix)){
            document.title = title + suffix;
        }
    },100);
});




// 【1】DOMContentLoaded 加载 yj.html 页脚 独立代码
window.addEventListener('DOMContentLoaded', function() {
    var xhr1 = new XMLHttpRequest();
    xhr1.open('GET', '/a/js/yj.html', true);
    xhr1.onreadystatechange = function() {
        if (xhr1.readyState === 4 && xhr1.status === 200) {
            document.body.insertAdjacentHTML('beforeend', xhr1.responseText);
        }
    };
    xhr1.send();
});


// 【2】DOMContentLoaded 加载 yj2.html 页脚 独立代码
window.addEventListener('DOMContentLoaded', function() {
    var xhr2 = new XMLHttpRequest();
    xhr2.open('GET', '/a/js/yj2.html', true);
    xhr2.onreadystatechange = function() {
        if (xhr2.readyState === 4 && xhr2.status === 200) {
            document.body.insertAdjacentHTML('beforeend', xhr2.responseText);
        }
    };
    xhr2.send();
});



