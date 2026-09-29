// <script src="/a/js/sxy.js"></script><!-- 上下页 -->页面加载完成后自动插入上下页按钮
window.addEventListener('load', function () {
  // 创建按钮容器
  const pageBar = document.createElement('div');
  pageBar.innerHTML = `
    <a href="/" target="_blank">返回</a>
    <a href="javascript:void(0)" id="prevPage">上一页</a>
    <a href="javascript:void(0)" id="nextPage">下一页</a>
  `;
  // 放在页面末尾（页脚）
  pageBar.style.marginTop = "30px";
  pageBar.style.padding = "10px 0";
  // 插入到页面最底部
  document.body.appendChild(pageBar);
  // 绑定点击事件
  document.getElementById('prevPage').onclick = goToPreviousPage;
  document.getElementById('nextPage').onclick = goToNextPage;
});
// 从 URL 提取页码，同时支持 1.html 以及 e2.html
function getPageInfo() {
  const url = window.location.href;
  // 正则：匹配末尾【数字.html】，兼容 1.html / e2.html / abc12.html
  const match = url.match(/(.*?)(\d+)\.html$/);
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
    window.open(nextPage, '_blank');
  } else {
    alert('无法识别当前页码');
  }
}
// 上一页
function goToPreviousPage() {
  const info = getPageInfo();
  if (info && info.num > 1) {
    const prevPage = info.prefix + (info.num - 1) + info.suffix;
    window.open(prevPage, '_blank');
  } else {
    alert('已经是第一页或无法识别当前页码');
  }
}
