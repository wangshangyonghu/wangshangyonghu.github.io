// ========= 批量加载CSS（并行加载，增加onerror容错；如果样式有覆盖依赖，可改用下方串行CSS函数） =========
const cssList = [
    "reset.css",
    "style.css",
    "mobile.css",
    "hr.css",
    "h.css",
    "xhx.css",
    "img.css",
    "zd.css",
    "bj.css",
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

// ========= 串行加载JS，保证顺序，单个JS加载失败自动继续下一个 =========
const jsList = [
    "tj.js",
    "a.js",
    "sl1.js",
    "sxy.js",
    "tel.js",
    "title.js",
    "zd.js",
    "dns.js"
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

// ========= 合并页面加载事件：加载页脚 + 修改标题，只绑定一次DOMContentLoaded（比window.load更早执行） =========
window.addEventListener('DOMContentLoaded', function() {
    // 加载页脚 gpc.html
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/a/js/gpc.html', true);
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
