//refactoring

module.exports = {
    
  // 탬플릿 정의 함수 => 매개변수를 받아 하나하나 출력
     HTML:function (title, list, body, control) {
      return `
      <!doctype html>
      <html>
      <head>
        <title>WEB1 - ${title}</title>
        <meta charset="utf-8">
      </head>
      <body>
        <h1><a href="/">WEB</a></h1>
        ${list}
        ${control}
        ${body}
      </body>
      </html>
      `;
    },
    list: function (filelist) {
      var list = '<ul>';
      var i = 0;
      while (i < filelist.length) {
        // 여기서 /?id=${파일이름}으로 id값 보내줌
        list = list + `<li><a href="/page/${filelist[i]}">${filelist[i]}</a></li>`;
        i = i + 1;
      }
      list = list + '</ul>';
      return list;
    }
  }
