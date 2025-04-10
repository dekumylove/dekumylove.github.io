const starCountLink = document.getElementById('starCountLink');
// 使用GitHub API获取星标数量，无需认证即可获取公开项目数据
fetch('https://api.github.com/repos/apache/singa')
   .then(response => response.json())
   .then(data => {
        const starCount = data.stargazers_count;
        starCountLink.textContent = starCount;
        starCountLink.setAttribute('aria-label', `${starCount} stargazers on GitHub`);
    })
   .catch(error => {
        console.error('Error fetching star count:', error);
        starCountLink.textContent = 'Error';
    });
