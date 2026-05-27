// 页面加载完成后自动插入上下页按钮
window.onload = function () {
  // 创建按钮容器
  const pageBar = document.createElement('div');
  pageBar.innerHTML = `
    <a href="/" target="_blank">返回</a>
    <a href="javascript:void(0)" id="prevPage">上一页</a>
    <a href="javascript:void(0)" id="nextPage">下一页</a>
  `;

  // 插入到页面
  document.body.appendChild(pageBar);

  // 绑定点击事件
  document.getElementById('prevPage').onclick = goToPreviousPage;
  document.getElementById('nextPage').onclick = goToNextPage;
};

// 从 URL 提取 前缀 + 数字 + 后缀
function getPageInfo() {
  const url = window.location.href;
  // 正则匹配：前缀 + 数字 + .html
  const match = url.match(/^(.*?)(\d+)(\.html)$/);
  if (match) {
    return {
      prefix: match[1],  // http://127.0.0.1/a/s/s
      num: parseInt(match[2]), // 2
      suffix: match[3]  // .html
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