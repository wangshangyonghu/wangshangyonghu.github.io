window.addEventListener('load', function() {
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/a/js/yj.html', true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState === 4 && xhr.status === 200) {
      document.body.insertAdjacentHTML('beforeend', xhr.responseText);
    }
  };
  xhr.send();
});

