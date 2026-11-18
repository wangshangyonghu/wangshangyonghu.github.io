/* ====================== 【模块1】页面标题自动追加后缀 @网上用户 ====================== 开始 */
// DOM加载完成后，给页面标题末尾统一追加 @网上用户
window.addEventListener('DOMContentLoaded', function() {
    setTimeout(function(){
        const suffix = '@网上用户';
        let title = document.title.trim();
        if(!title.endsWith(suffix)){
            document.title = title + suffix;
        }
    },100);
});
/* ====================== 【模块1】页面标题自动追加后缀 @网上用户 ====================== 结束 */



/* ====================== 【模块2】加载 yj.html 页脚（远程优先，失败切本地） ====================== 开始 */
// DOM加载完成后拉取页脚：先取远程github地址，3秒超时/失败自动回退本地文件
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
/* ====================== 【模块2】加载 yj.html 页脚（远程优先，失败切本地） ====================== 结束 */



/* ====================== 【模块3】加载 yj2.html 本地页脚 ====================== 开始 */
// DOM加载完成后拉取第二个本地页脚 yj2.html
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
/* ====================== 【模块3】加载 yj2.html 本地页脚 ====================== 结束 */



/* ====================== 【模块4】51la 统计 SDK 核心脚本 ====================== 开始 */
// 动态写入 51la 统计核心 SDK
document.write("<script>!function(p){\"use strict\";!function(t){var s=window,e=document,i=p,c=\"\".concat(\"https:\"===e.location.protocol?\"https://\":\"http://\",\"sdk.51.la/js-sdk-pro.min.js\"),n=e.createElement(\"script\"),r=e.getElementsByTagName(\"script\")[0];n.type=\"text/javascript\",n.setAttribute(\"charset\",\"UTF-8\"),n.async=!0,n.src=c,n.id=\"LA_COLLECT\",i.d=n;var o=function(){s.LA.ids.push(i)};s.LA?s.LA.ids&&o():(s.LA=p,s.LA.ids=[],o()),r.parentNode.insertBefore(n,r)}()}({id:\"KQv2SuxOiVumZFtb\",ck:\"KQv2SuxOiVumZFtb\"});</script>")
/* ====================== 【模块4】51la 统计 SDK 核心脚本 ====================== 结束 */



/* ====================== 【模块5】51la 前台展示面板 ====================== 开始 */
// 页面全部资源加载完成后，再加载 51la 数据展示小组件
window.addEventListener('load', function(){
  const s = document.createElement('script');
  s.id = "LA-DATA-WIDGET";
  s.crossOrigin = "anonymous";
  s.charset = "UTF-8";
  s.src = "https://v6-widget.51.la/v6/KQv2SuxOiVumZFtb/quote.js?theme=0&col=true&f=12";
  document.body.appendChild(s);
});
/* ====================== 【模块5】51la 前台展示面板 ====================== 结束 */



/* ====================== 【模块6】百度统计 - 站点1（web1337.net） ====================== 开始 */
// 百度统计：wangshangyonghu.web1337.net
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?6d56dbf88f060ad354f3b80c2722bf0c";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
/* ====================== 【模块6】百度统计 - 站点1（web1337.net） ====================== 结束 */



/* ====================== 【模块7】百度统计 - 站点2（github.io） ====================== 开始 */
// 百度统计：wangshangyonghu.github.io
var _hmt = _hmt || [];
(function() {
  var hm = document.createElement("script");
  hm.src = "https://hm.baidu.com/hm.js?7313f859309df7546cda1cc0cbfc28da";
  var s = document.getElementsByTagName("script")[0];
  s.parentNode.insertBefore(hm, s);
})();
/* ====================== 【模块7】百度统计 - 站点2（github.io） ====================== 结束 */



/* ====================== 【模块8】DNS 预解析（提前解析远端域名） ====================== 开始 */
const dnsList = [
  "//wangshangyonghu.github.io"
];
dnsList.forEach(host=>{
  // 防止重复添加 link 标签
  if(!document.querySelector(`link[rel="dns-prefetch"][href="${host}"]`)){
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = host;
    document.head.appendChild(link);
  }
});
/* ====================== 【模块8】DNS 预解析（提前解析远端域名） ====================== 结束 */



/* ====================== 【模块9】图片预加载（提前加载常用图片） ====================== 开始 */
const imgPreload = [
  "https://wangshangyonghu.github.io/tu/jpg1/1.jpg"
];
imgPreload.forEach(href=>{
  if(!document.querySelector(`link[rel="preload"][href="${href}"][as="image"]`)){
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = "image";
    link.type = "image/jpeg";
    document.head.appendChild(link);
  }
});
/* ====================== 【模块9】图片预加载（提前加载常用图片） ====================== 结束 */



/* ====================== 【模块10】全部链接新窗口打开 + 安全 rel 属性 ====================== 开始 */
// DOM加载完成后，所有 a 标签统一新窗口打开，并加上 noopener noreferrer 安全属性
document.addEventListener('DOMContentLoaded', function(){
    const allA = document.querySelectorAll('a');
    allA.forEach(function(a){
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
    })
})
/* ====================== 【模块10】全部链接新窗口打开 + 安全 rel 属性 ====================== 结束 */



/* ====================== 【模块11】今日头条自动收录推送脚本 ====================== 开始 */
// 让页面自动提交给头条收录
(function(){
var el = document.createElement("script");
el.src = "https://lf1-cdn-tos.bytegoofy.com/goofy/ttzz/push.js?4fe1616d6b94069ca37b85d5963fbf3e9b5e8f8ec37dc597cbf0a0f9432db085ed00990171a01a724f0f07b37598cb604a4d40de0dd5fa9b5c2c10f69a3b501dc430e831103b45ce33654fb9f95b006c";
el.id = "ttzz";
var s = document.getElementsByTagName("script")[0];
s.parentNode.insertBefore(el, s);
})(window)
/* ====================== 【模块11】今日头条自动收录推送脚本 ====================== 结束 */



/* ====================== 【模块12】底部上下页/返回 分页按钮 ====================== 开始 */
// 页面加载完成后，在页面底部插入【返回 / 上一页 / 下一页】按钮
window.addEventListener('load', function () {
  // 创建按钮容器
  const pageBar = document.createElement('div');
  pageBar.innerHTML = `
    <a href="/" target="_blank">返回</a>
    <a href="javascript:void(0)" id="prevPage">上一页</a>
    <a href="javascript:void(0)" id="nextPage">下一页</a>
  `;
  // 页脚显示，不悬浮
  pageBar.style.marginTop = "30px";
  pageBar.style.padding = "10px 0";
  // 插入页面最底部
  document.body.appendChild(pageBar);
  // 绑定点击事件
  document.getElementById('prevPage').onclick = goToPreviousPage;
  document.getElementById('nextPage').onclick = goToNextPage;
});

// 从 URL 提取页码，自动忽略 ? 后面的参数
function getPageInfo() {
  // 去掉 ? 后面所有查询参数
  const urlPure = window.location.href.split('?')[0];
  // 正则：匹配 1.html / e2.html / abc12.html
  const match = urlPure.match(/(.*?)(\d+)\.html$/);
  if (match) {
    return {
      prefix: match[1],
      num: parseInt(match[2]),
      suffix: ".html"
    };
  }
  return null;
}

// 下一页
function goToNextPage() {
  const info = getPageInfo();
  if (info) {
    const nextPage = info.prefix + (info.num + 1) + info.suffix;
    // 保留原有的 ? 参数带到下一页
    const searchStr = window.location.search;
    window.open(nextPage + searchStr, '_blank');
  } else {
    alert('无法识别当前页码');
  }
}

// 上一页
function goToPreviousPage() {
  const info = getPageInfo();
  if (info && info.num > 1) {
    const prevPage = info.prefix + (info.num - 1) + info.suffix;
    // 同样带上 ? 参数
    const searchStr = window.location.search;
    window.open(prevPage + searchStr, '_blank');
  } else {
    alert('已经是第一页或无法识别当前页码');
  }
}
/* ====================== 【模块12】底部上下页/返回 分页按钮 ====================== 结束 */



/* ====================== 【模块13】页面手机号自动转拨号链接 ====================== 开始 */
// 匹配国内手机号正则：1开头，第2位3-9，后面9位数字，全局匹配
const regPhone = /(1[3-9]\d{9})/g;

/**
 * 将文本中的手机号替换成 tel 拨号链接
 * @param {string} text 原始文本
 * @returns {string} 替换后带a标签的html
 */
function phoneToLink(text){
  return text.replace(regPhone, '<a href="tel:$1">$1</a>');
}

/**
 * 递归扫描节点，把文本里手机号转为拨号链接
 * @param {HTMLElement} rootEl 扫描的根节点
 */
function scanAndReplace(rootEl){
  const childNodes = rootEl.childNodes;
  // 倒序循环，防止替换节点打乱下标
  for(let i = childNodes.length -1; i >=0; i--){
    const node = childNodes[i];
    // nodeType 3 = 纯文本节点
    if(node.nodeType === 3){
      const txt = node.textContent;
      // 判断文本里面是否包含手机号
      if(regPhone.test(txt)){
        const wrap = document.createElement('span');
        wrap.innerHTML = phoneToLink(txt);
        // 用新span替换原来的文本节点
        node.parentNode.replaceChild(wrap, node);
      }
    }
    // nodeType 1 = html元素节点
    else if(node.nodeType === 1){
      // 跳过a标签，避免链接里面的号码重复套a标签
      if(node.tagName !== 'A'){
        scanAndReplace(node);
      }
    }
  }
}

// DOM就绪就执行手机号替换，能识别后面加载的页脚内容
document.addEventListener('DOMContentLoaded', function(){
  scanAndReplace(document.body);
});
/* ====================== 【模块13】页面手机号自动转拨号链接 ====================== 结束 */



/* ====================== 【模块14】本页网址二维码生成模块 ====================== 开始 */
(function(){
    let qrDone = false;
    let qrBox;
    let imgEl;
    let qrText;
    let qrcodeReady = false;

    // 动态加载 qrcode.min.js 二维码库
    function loadQrcodeScript(callback){
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js";
        script.onload = function(){
            qrcodeReady = true;
            callback();
        };
        script.onerror = function(){
            if(qrText) qrText.innerText = "二维码库加载失败";
            if(qrText) qrText.style.color = "red";
        };
        document.head.appendChild(script);
    }

    function initUI(){
        // 创建点击文字
        qrText = document.createElement('div');
        qrText.innerText = "二维码(加载中...)";
        qrText.style.cursor = "pointer";
        qrText.style.color = "#0066cc";
        qrText.style.display = "inline-block";
        qrText.onclick = createQr;
        document.body.appendChild(qrText);

        // 外层容器
        qrBox = document.createElement('div');
        qrBox.style.marginTop = "15px";
        qrBox.style.display = "none";
        document.body.appendChild(qrBox);

        // 图片标签放二维码
        imgEl = document.createElement('img');
        imgEl.style.width = "220px";
        qrBox.appendChild(imgEl);
    }

    function createQr(){
        if(!qrcodeReady){
            alert("二维码库还没加载完成，请稍后点击");
            return;
        }
        if(qrDone){
            qrBox.style.display = qrBox.style.display === 'none' ? 'block' : 'none';
            return;
        }
        // 获取地址栏完整网址
        const currentUrl = window.location.href;
        QRCode.toDataURL(currentUrl, {width:220}, function(err, url){
            if(err){
                console.error("二维码生成错误：",err);
                alert("二维码生成失败");
                return;
            }
            imgEl.src = url;
            qrBox.style.display = "block";
            qrDone = true;
        })
    }

    // 等待DOM就绪，保证 document.body 存在
    function start(){
        if(document.readyState === "loading"){
            document.addEventListener("DOMContentLoaded", function(){
                initUI();
                loadQrcodeScript(function(){
                    qrText.innerText = "本页二维码";
                });
            });
        }else{
            initUI();
            loadQrcodeScript(function(){
                qrText.innerText = "本页二维码";
            });
        }
    }
    start();
})();
/* ====================== 【模块14】本页网址二维码生成模块 ====================== 结束 */



/* ====================== 【模块15】回到顶部悬浮按钮 ====================== 开始 */
// 滚动超过 200px 显示按钮，点击平滑回到顶部
window.addEventListener('load', function(){
    const topBtn = document.createElement('button');
    topBtn.id = "goTopBtn";
    topBtn.innerText = "回到顶部";
    document.body.appendChild(topBtn);

    topBtn.onclick = function(){
        window.scrollTo({top:0,behavior:"smooth"});
    }

    window.addEventListener('scroll',function(){
        if(window.scrollY > 200){
            topBtn.style.display = "block";
        }else{
            topBtn.style.display = "none";
        }
    })
})
/* ====================== 【模块15】回到顶部悬浮按钮 ====================== 结束 */



/* ====================== 【模块16】JS 内注入全局 CSS 样式 ====================== 开始 */
// 创建 style 标签，样式全部内置在本文件，不再请求外部 css，节省 Hits
const style = document.createElement('style');

// 注意：包裹样式的模板字符串 ` 不能丢，丢了代码直接报错
style.textContent = `

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

/*回到顶部按钮样式*/
#goTopBtn{
    position: fixed;
    bottom:20px;
    right:20px;
    display:none;
    padding:6px 12px;
    z-index:999;
}
`;
// 将style标签追加到页面head，样式生效
document.head.appendChild(style);
/* ====================== 【模块16】JS 内注入全局 CSS 样式 ====================== 结束 */
