// 页面标题更新器 - 支持自定义前缀
function updatePageTitle(customPrefix = '') {
    // 获取当前页面的URL
    const url = window.location.href;
    // 从URL中提取文件名
    const fileName = url.split('/').pop().split('?')[0];
    // 去除文件扩展名
    const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

    // 构建新标题：前缀 + 文件名 + 原始标题
    let newTitleParts = [];
    if (customPrefix) newTitleParts.push(customPrefix);
    if (fileNameWithoutExt) newTitleParts.push(fileNameWithoutExt);
    newTitleParts.push('搜索:网上用户'); // 固定保留原始标题

    const newTitle = newTitleParts.join('一');
    document.title = newTitle;
}

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
    updatePageTitle('网上用户一aaa888一');
});