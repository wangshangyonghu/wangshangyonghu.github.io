// 设备判断
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 淘宝固定联盟链接
const urls = {
    mobileApp: "taobao://ai.m.taobao.com/search.html?&pid=mm_5518923388_3058500304_116069600003&union_lens=lensId%3APUB%401781582035%402103e876_1697_19ece907902_04ff%4001&q=",
    mobileWeb: "https://ai.m.taobao.com/search.html?&pid=mm_5518923388_3058500304_116069600003&union_lens=lensId%3APUB%401781582035%402103e876_1697_19ece907902_04ff%4001&q=",
    pcWeb: "https://ai.taobao.com/search/index.htm?&pid=mm_5518923388_3058500304_116069600003&union_lens=lensId%3APUB%401781581630%400b11d4cc_15e6_19ece8a4d26_050d%4001&key="
};
const linksConfig = {
    mobileBase: "taobao://ai.m.taobao.com/search.html?&pid=mm_5518923388_3058500304_116069600003&union_lens=lensId%3APUB%401781582035%402103e876_1697_19ece907902_04ff%4001&q=",
    pcBase: "https://ai.taobao.com/search/index.htm?&pid=mm_5518923388_3058500304_116069600003&union_lens=lensId%3APUB%401781581630%400b11d4cc_15e6_19ece8a4d26_050d%4001&key="
};

// 渲染关键词按钮通用函数
function generateLinks(keywordData) {
    const container = document.getElementById("linkContainer");
    if (!container) return;
    const baseUrl = isMobileDevice() ? linksConfig.mobileBase : linksConfig.pcBase;
    Object.entries(keywordData).forEach(([category, keywords]) => {
        const categoryDiv = document.createElement("div");
        categoryDiv.className = "keyword-category";
        const titleElement = document.createElement("div");
        titleElement.className = "category-title";
        titleElement.textContent = category;
        categoryDiv.appendChild(titleElement);
        const buttonsDiv = document.createElement("div");
        buttonsDiv.className = "keyword-buttons";
        const uniqueKeywords = [...new Set(keywords)].filter(k => k.trim());
        uniqueKeywords.forEach(keyword => {
            const link = document.createElement("a");
            link.href = baseUrl + encodeURIComponent(keyword);
            link.target = "_blank";
            link.textContent = keyword;
            link.className = "keyword-btn";
            buttonsDiv.appendChild(link);
        });
        categoryDiv.appendChild(buttonsDiv);
        container.appendChild(categoryDiv);
    });
}

// 页面初始化统一逻辑
function initPage(pageCfg, keywordList) {
    document.title = pageCfg.title;
    document.querySelector('meta[name="keywords"]').content = pageCfg.metaKeywords;
    document.querySelector('.search-input').placeholder = pageCfg.searchTip;

    window.addEventListener('load', function() {
        const searchInput = document.querySelector('.search-input');
        if (searchInput) searchInput.focus();
        generateLinks(keywordList);

        // 搜索提交
        const searchForm = document.getElementById('searchForm');
        searchForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const val = searchInput.value.trim();
            if (!val) {
                alert('请输入搜索关键词');
                return;
            }
            const encodeVal = encodeURIComponent(val);
            if (isMobileDevice()) {
                const iframe = document.createElement('iframe');
                iframe.style.display = 'none';
                iframe.src = urls.mobileApp + encodeVal;
                document.body.appendChild(iframe);
                setTimeout(() => {
                    document.body.removeChild(iframe);
                    window.location.href = urls.mobileWeb + encodeVal;
                }, 300);
            } else {
                window.location.href = urls.pcWeb + encodeVal;
            }
        });

        // 店铺链接自动切换淘宝APP协议
        document.querySelectorAll('.app-btn').forEach(link => {
            if (isMobileDevice()) {
                link.href = link.href.replace('https://', 'taobao://');
            }
        });
    });
}