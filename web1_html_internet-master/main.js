var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
//refactoring
var template = {
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
      list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
      i = i + 1;
    }
    list = list + '</ul>';
    return list;
  }
}


//여기서 작업이 진행
var app = http.createServer((request, response) => {
  var _url = request.url; // ex) /?id=Javascript
  // => const { url } = request;
  var queryData = url.parse(_url, true).query; // url의 쿼리문을 배열 형식으로 가져옴 ex) { id: 'Javascript'}
  var pathname = url.parse(_url, true).pathname; // ex) /create

  // console.log(_url);
  // console.log(queryData);
  // console.log(pathname);

  //index 메인
  if (pathname === '/') {
    if (queryData.id === undefined) {
      fs.readdir('./data', (error, filelist) => {
        var title = 'Welcome';
        var description = 'Hello, Node.js';
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          `<h2>${title}</h2>${description}`,
          `<a href="/create">create</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    }
    //filelist에서 보내준 id값
    else {
      fs.readdir('./data', (error, filelist) => {
        fs.readFile(`data/${queryData.id}`, 'utf8', (err, description) => {
          var title = queryData.id;
          var list = template.list(filelist);
          var html = template.HTML(title, list,
            `<h2>${title}</h2>${description}`,
            `<a href="/create">create</a> 
              <a href="/update?id=${title}">update</a>
              <form action="delete_process" method="post">
                <input type="hidden" name="id" value="${title}">
                <input type="submit" value="delete">
              </form>`
          );
          response.writeHead(200);
          response.end(html);
        });
      });
    }
  }
  else if (pathname === '/create') {
    fs.readdir('./data', (error, filelist) => {
      var title = 'WEB - create';
      var list = template.list(filelist);
      var html = template.HTML(title, list, `
          <form action="/create_process" method="post">
            <p><input type="text" name="title" placeholder="title"></p>
            <p>
              <textarea name="description" placeholder="description"></textarea>
            </p>
            <p>
              <input type="submit">
            </p>
          </form>
        `, '');
      response.writeHead(200);
      response.end(html);
    });
  } else if (pathname === '/create_process') {
    var body = '';
    // request.on 으로 클라이언트로 부터 보내진 데이터 값을 받아 body에 입력
    request.on('data', (data) => {
      body = body + data;
      // console.log(data);
    });
    request.on('end', () => {
      var post = qs.parse(body);
      var title = post.title;
      var description = post.description;

      // console.log("post : ",post);
      // console.log("post.title : ",title);
      // console.log("description : ",post.description);
      //파일을 create 하고 id=${title}로 이동
      fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
        response.writeHead(302, { Location: `/?id=${title}` });
        response.end();
      })
    });
  } else if (pathname === '/update') {
    fs.readdir('./data', (error, filelist) => {
      fs.readFile(`data/${queryData.id}`, 'utf8', (err, description) => {
        var title = queryData.id;
        var list = template.list(filelist);
        var html = template.HTML(title, list,
          //hidden 속성을 통해 수정되지 않은 원래 name의 값을 가져올수 있음
          `
            <form action="/update_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <p><input type="text" name="title" placeholder="title" value="${title}"></p>
              <p>
                <textarea name="description" placeholder="description">${description}</textarea>
              </p>
              <p>
                <input type="submit">
              </p>
            </form>
            `,
          `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
        );
        response.writeHead(200);
        response.end(html);
      });
    });
  } else if (pathname === '/update_process') {
    var body = '';
    //post 방식으로 클라이언트에서 전송된 데이터를 받는방법
    /*request on data는 웹 브라우저가 post방식으로 데이터를 전송할때 데이터가 엄청나게 많으면
    그 데이터를 한번에 처리하면 컴퓨터가 무리할 수 있다.
    Node js에서는 이러한 방식으로 대처한다.
    어떤 특정한 양 예를 들어 100이 있으면 조각조각 
    When an HTTP request hits the server, node calls the request handler function with a few handy objects for dealing with the transaction, request and response. We'll get to those shortly.

In order to actually serve requests, the listen method needs to be called on the server object. In most cases, all you'll need to pass to listen is the port number you want the server to listen on. There are some other options too, so consult the API reference.
*/

    request.on('data', (data) => {
      body = body + data;
    });
    request.on('end', () => {
      var post = qs.parse(body);
      var id = post.id;
      var title = post.title;
      var description = post.description;
      fs.rename(`data/${id}`, `data/${title}`, (error) => {
        fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
          response.writeHead(302, { Location: `/?id=${title}` });
          response.end();
        })
      });
    });
  }
  else if (pathname === '/delete_process') {
    var body = '';
    request.on('data', (data) => {
      body = body + data;
    });
    request.on('end', () => {
      var post = qs.parse(body);
      var id = post.id;
      //삭제하고 다시 인덱스로 보내줌
      fs.unlink(`data/${id}`, (err) => {
        response.writeHead(302, { Location: `/` });
        response.end();
      })
    });
  }
  else {
    response.writeHead(404);
    response.end('Not found');
  }
});
app.listen(3000);