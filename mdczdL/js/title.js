// 页面标题更新器 - 支持自定义前缀
    function updatePageTitle(customPrefix = '') {
        // 获取当前页面的URL
        const url = window.location.href;
        // 从URL中提取文件名
        const fileName = url.split('/').pop().split('?')[0];
        // 去除文件扩展名
        const fileNameWithoutExt = fileName.replace(/\.[^/.]+$/, "");
        // 获取原始标题内容
        const originalTitle = document.title;
        
        // 构建新标题：自定义前缀 + 文件名(无扩展名) + 原始标题
        let newTitleParts = [];
        if (customPrefix) newTitleParts.push(customPrefix);
        newTitleParts.push(fileNameWithoutExt);
        newTitleParts.push(originalTitle);
        
        const newTitle = newTitleParts.join('一');
        // 设置新标题
        document.title = newTitle;
    }

    // 当页面加载完成后执行标题更新
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            // 这里可以修改自定义前缀内容
            updatePageTitle('铆钉厂张东良的微信:mdczdL一');
        });
    } else {
        // 这里可以修改自定义前缀内容
        updatePageTitle('网上用户');
    }
    