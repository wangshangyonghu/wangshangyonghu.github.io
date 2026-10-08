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
    "a.js",
    "sl1.js",
    "sxy.js",
    "tel.js",
    "title.js",
    "zd.js",
    "dns.js",
    "tj.js"
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



// 合并事件：DOMContentLoaded 一次性执行，加载两个页脚+修改标题，比window.load更早渲染
window.addEventListener('DOMContentLoaded', function() {
    // 加载 r.html 页脚
    var xhr1 = new XMLHttpRequest();
    xhr1.open('GET', '/a/js/r.html', true);
    xhr1.onreadystatechange = function() {
        if (xhr1.readyState === 4 && xhr1.status === 200) {
            document.body.insertAdjacentHTML('beforeend', xhr1.responseText);
        }
    };
    xhr1.send();



    // 加载 r.html 页脚
    var xhr2 = new XMLHttpRequest();
    xhr2.open('GET', '/a/js/yj2.html', true);
    xhr2.onreadystatechange = function() {
        if (xhr2.readyState === 4 && xhr2.status === 200) {
            document.body.insertAdjacentHTML('beforeend', xhr2.responseText);
        }
    };
    xhr2.send();

    // 页面标题追加后缀 @网上用户
    setTimeout(function(){
        const suffix = '@网上用户';
        let title = document.title.trim();
        if(!title.endsWith(suffix)){
            document.title = title + suffix;
        }
    },100);
});
