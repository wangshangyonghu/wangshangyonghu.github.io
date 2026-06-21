// 1. 判断设备类型（手机或电脑）
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// 2. 定义各端链接（手机端含APP Scheme和网页链接，电脑端用PC网页链接）
const urls = {
    mobileApp: "taobao://ai.m.taobao.com/search.html?&pid=mm_5518923388_3058500304_116069600003&union_lens=lensId%3APUB%401761006738%400b8f386d_1236_19a042e5ba0_058e%4001&q=",
    mobileWeb: "https://ai.m.taobao.com/search.html?&pid=mm_5518923388_3058500304_116069600003&union_lens=lensId%3APUB%401761006738%400b8f386d_1236_19a042e5ba0_058e%4001&q=",
    pcWeb: "https://ai.taobao.com/search/index.htm?&pid=mm_5518923388_3058500304_116069600003&union_lens=lensId%3APUB%401761007367%400bbb5ce5_21f4_19a0437f5b8_0586%4001&key="
};

window.addEventListener('load', function() {
    const searchInput = document.querySelector('.search-input');
    searchInput.focus();

    const searchForm = document.getElementById('searchForm');
    searchForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const inputValue = searchInput.value.trim();

        if (!inputValue) {
            alert('请输入搜索关键词');
            return;
        }

        const encodedKeyword = encodeURIComponent(inputValue);
        const isMobile = isMobileDevice();

        // 3. 设备区分处理：手机端优先跳APP，电脑端直接跳PC网页
        if (isMobile) {
            // 尝试通过iframe触发手机淘宝APP跳转
            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            iframe.src = urls.mobileApp + encodedKeyword;
            document.body.appendChild(iframe);

            // 300毫秒后检测，若APP未打开则跳转移动端网页
            setTimeout(() => {
                document.body.removeChild(iframe);
                window.location.href = urls.mobileWeb + encodedKeyword;
            }, 300);
        } else {
            // 电脑端直接跳转PC网页链接
            window.location.href = urls.pcWeb + encodedKeyword;
        }
    });

    // 热门关键词点击填充搜索框（新增功能）
    const keywordBtns = document.querySelectorAll('.keyword-btn');
    keywordBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            searchInput.value = this.innerText;
            searchForm.dispatchEvent(new Event('submit'));
        })
    })
});