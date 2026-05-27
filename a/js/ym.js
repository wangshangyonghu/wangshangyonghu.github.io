// <script src="/a/js/ym.js"></script>
// 公共头部加载脚本
// 功能：远程读取ym.html公共配置，自动注入网页头部
// 使用：页面任意位置引入均可正常生效
(function () {
  // 公共HTML配置文件路径
  const commonHtmlPath = '/a/js/ym.html';

  // 请求读取公共头部代码
  fetch(commonHtmlPath)
    .then(res => res.text())
    .then(html => {
      // 将配置插入页面头部最前方
      document.head.insertAdjacentHTML('afterbegin', html);
    })
    // 加载失败控制台提示
    .catch(err => {
      console.log('公共头部文件加载失败：', err);
    });
})();

