// ========= CSS样式预加载（多个css） =========
const cssPreload = [
  "/a/js/bj.css",
  "/a/js/h.css",
  "/a/js/hr.css"
];
cssPreload.forEach(href=>{
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = "style";
  document.head.appendChild(link);
});
