var express = require('express');
var app = express();
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var sanitizeHtml = require('sanitize-html');
var template = require('./lib/template.js');


//route, routing
//app.get('/', (req, res) => res.send('hello world'));
// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });
app.get('/', (req, res) => {
  fs.readdir('./data', (error, filelist) => {
    var title = 'Welcome';
    var description = 'Hello, Node.js';
    var list = template.list(filelist);
    var html = template.HTML(title, list,
      `<h2>${title}</h2>${description}`,
      `<a href="/create">create</a>`
    );
    // res.writeHead(200);
    // response.end(html);
    res.send(html);
  });
});
app.get('/page/:pageId', (req, res) =>{
  fs.readdir('./data', (error, filelist) => {
    
    filteredId = path.parse(req.params.pageId).base;
    fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {

      var title = req.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ['h1']
      });
      var list = template.list(filelist);
      var html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/create">create</a>
            <a href="/update?id=${sanitizedTitle}">update</a>
            <form action="delete_process" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`
      );

      res.send(html);
    });
  });
});

app.get('/create',(req,res)=> {
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
    res.send(html);
  });
});
//app.post('create', (res,req)=>{
//create로 똑같이 받아서 post,get 방식에 따라 구분하기도함
app.post('/create_process', (req,res)=>{
  var body = '';
  req.on('data', (data) => {
    body = body + data;
  });
  req.on('end', () => {
    var post = qs.parse(body);
    var title = post.title;
    var description = post.description;
    fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
      res.writeHead(302, { Location: `/?id=${title}` });
      res.end();
    })
  });
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});



/*var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
var template = require('./lib/template.js');
var path = require('path');
var sanitizeHtml = require('sanitize-html');

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
      });
    }
    //filelist에서 보내준 id값
    else {
      fs.readdir('./data', (error, filelist) => {
        // 보안 이슈
        filteredId = path.parse(queryData.id).base;
        fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {

          var title = queryData.id;
          var sanitizedTitle = sanitizeHtml(title);
          var sanitizedDescription = sanitizeHtml(description, {
            allowedTags: ['h1']
          });
          var list = template.list(filelist);
          var html = template.HTML(sanitizedTitle, list,
            `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
            ` <a href="/create">create</a>
                <a href="/update?id=${sanitizedTitle}">update</a>
                <form action="delete_process" method="post">
                  <input type="hidden" name="id" value="${sanitizedTitle}">
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
  } else if (pathname === '/create_process') {
  } else if (pathname === '/update') {
    fs.readdir('./data', (error, filelist) => {
      filteredId = path.parse(queryData.id).base;
      fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {
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
      var filteredId = path.parse(id).base;
      //삭제하고 다시 인덱스로 보내줌
      fs.unlink(`data/${filteredId}`, (err) => {
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
app.listen(3000);*/