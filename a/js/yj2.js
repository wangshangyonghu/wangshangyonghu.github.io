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
    // 增加容错
    link.onload = ()=>{};
    link.onerror = ()=>{};
    document.head.appendChild(link);
});

// 串行加载JS，保证加载顺序，单个js失败自动继续下一个
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

// 合并DOMContentLoaded：加载yj2.html页脚 + 修改标题（更早执行，只绑定一次事件）
window.addEventListener('DOMContentLoaded', function() {
    // 加载 yj2.html 页脚
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/a/js/yj2.html', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                document.body.insertAdjacentHTML('beforeend', xhr.responseText);
            }
        }
    };
    xhr.send();

    // 页面标题追加后缀 @网上用户
    setTimeout(function(){
        const suffix = '@网上用户';
        let title = document.title.trim();
        if(!title.endsWith(suffix)){
            document.title = title + suffix;
        }
    },100);
});
