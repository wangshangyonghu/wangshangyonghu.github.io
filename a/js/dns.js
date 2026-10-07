// ========= DNS预解析（多个域名） =========
const dnsList = [
  "//wangshangyonghu.github.io",
  "//wangshangyonghu.web1337.net"
];
dnsList.forEach(host=>{
  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = host;
  document.head.appendChild(link);
});

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

// ========= 图片预加载（多张图片） =========
const imgPreload = [
  "/tu/jpg1/57.jpg"
];
imgPreload.forEach(href=>{
  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = href;
  link.as = "image";
  document.head.appendChild(link);
});
