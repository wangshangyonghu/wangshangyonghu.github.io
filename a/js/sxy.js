// <script src="/a/js/sxy.js"></script><!-- 上下页 -->页面加载完成后自动插入上下页按钮
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
// 从 URL 提取页码，自动忽略 ?后面的参数
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
    // 保留原有的 ?i=1 参数带到下一页
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
    // 同样带上 ?i=1 参数
    const searchStr = window.location.search;
    window.open(prevPage + searchStr, '_blank');
  } else {
    alert('已经是第一页或无法识别当前页码');
  }
}
