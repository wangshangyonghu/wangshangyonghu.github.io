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
    "a1.js",
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
    loadHtml('https://wangshangyonghu.github.io/a/js/yj.html', '/a/js/yj.html');
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











// 等待页面DOM结构加载完成后再执行，防止找不到a标签
document.addEventListener('DOMContentLoaded', function () {
    // 选中页面上所有 target="_blank" 的超链接
    document.querySelectorAll('a[target="_blank"]').forEach(el => {
        // 获取a标签现有的rel属性，没有就设为空字符串
        const rel = el.getAttribute('rel') || '';
        // 判断rel里面还没有 noopener，避免重复添加
        if (!rel.includes('noopener')) {
            // 在原有rel基础上追加 noopener noreferrer 安全属性
            el.setAttribute('rel', rel + ' noopener noreferrer');
        }
    });
});


