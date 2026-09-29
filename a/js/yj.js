//  <script src="/a/js/js.js"></script>批量加载所有css
const cssList = [
    "reset.css",
    "style.css",
    "mobile.css",
    "hr.css",
    "h.css",
    "xhx.css",
    "img.css",
    "zd.css",
    "p.css"
];
cssList.forEach(href=>{
    let link = document.createElement('link');
    link.rel = "stylesheet";
    link.href = "/a/js/" + href;
    document.head.appendChild(link);
});









// <script src="/a/js/js.js"></script>串行加载JS，保证加载顺序
const jsList = [
    "a.js",
    "sl1.js",
    "sxy.js",
    "tel.js",
    "title.js",
    "zd.js",
    "tj.js",

];
function loadScripts(scriptArray, index = 0) {
    if (index >= scriptArray.length) return;
    let s = document.createElement('script');
    s.src = "/a/js/" + scriptArray[index];
    s.onload = () => {
        loadScripts(scriptArray, index + 1);
    };
    document.head.appendChild(s);
}
loadScripts(jsList);








// 第一段：加载 yj.html 页脚
window.addEventListener('load', function() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/a/js/yj.html', true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.body.insertAdjacentHTML('beforeend', xhr.responseText);
    }
  };
  xhr.send();
});











// 第三段：页面load之后，延迟修改标题
window.addEventListener('load', function() {
  setTimeout(function(){
    const suffix = '@网上用户';
    let title = document.title.trim();
    if(!title.endsWith(suffix)){
      document.title = title + suffix;
    }
  },100);
});
