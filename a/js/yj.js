// 批量加载所有css
const cssList = [
    "css.css",
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




// 创建style标签，用于注入全局css样式
const style = document.createElement('style');

// 注意：包裹样式的模板字符串 ` 不能丢，丢了代码直接报错
style
.textContent = `

/* 去掉所有链接下划线 */
a {
  text-decoration: none;
}

/* 统一h1~h6标题字号为12px */
h1 { font-size: 12px; }
h2 { font-size: 12px; }
h3 { font-size: 12px; }
h4 { font-size: 12px; }
h5 { font-size: 12px; }
h6 { font-size: 12px; }

/* 统一所有标题上下外边距1px */
h1,h2,h3,h4,h5,h6 {
    margin:1px 0;
}

hr {
    margin:1px 0;        /* 分割线上下外边距1px，左右外边距0，左右贴边 */
    border: none;        /* 清除hr标签浏览器默认自带边框 */
    height:1px;          /* 线条高度1px */
    background-color:#000000; /* 背景填充纯黑，比border更黑 */
}

/*图片自适应，不超出容器不变形，不强制单独一行*/
img{
  max-width:100%; /* 最大宽度不超过父容器，大图自动缩小 */
  height:auto;    /* 高度随宽度自动缩放，防止图片变形 */
  vertical-align: middle; /* 消除图片底部自带的基线空白缝隙 */
}

p {
  margin: 0; /* 清除p标签默认上下外边距，取消段落之间自带空白 */
  padding: 0; /* 清除p标签默认内边距，文字与p边框之间不留空隙 */
}

body {
  padding: 10px 10px; /* 页面整体内边距，上下10px，左右10px，内容不靠贴浏览器边缘 */
}
`;
// 将style标签追加到页面head，样式生效
document
.head.appendChild(style);