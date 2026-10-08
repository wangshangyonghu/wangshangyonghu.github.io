// ========= JS脚本预加载（多个js） =========
const jsPreload = [
  "/a/js/yj.js",
  "/a/js/yj2.js",
  "/a/js/gpc.js"
];
jsPreload.forEach(href=>{
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = "script";
  document.head.appendChild(link);
});
