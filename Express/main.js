var express = require('express')
var app = express()
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var bodyParser = require('body-parser');
var sanitizeHtml = require('sanitize-html');
var compression = require('compression')
var template = require('./lib/template.js');

// third-party 미들웨어
app.use(express.static('public')); //public 디랙토리 안에서 스태틱 파일을 찾겠다.
app.use(bodyParser.urlencoded({ extended: false }));
app.use(compression());

// Application level middleware
// App.use는 미들웨어 함수를 받는다.

//req와 res를 받아서 변형할 수 있다.
app.get('*', function (req, res, next) {
  fs.readdir('./data', (error, filelist) => {
    req.list = filelist;
    next(); // 다음에 미들웨어 함수를 실행할지 말아야할지를 결정!
  });
});

// express는 미들웨어로 구성!

// route, routing
// app.get('/', (req, res) => res.send('hello world'));
// app.get('/', function (req, res) {
//   res.send('Hello World!');
// });
app.get('/', (req, res) => {
  var title = 'Welcome';
  var description = 'Hello, Node.js';
  var list = template.list(req.list);
  var html = template.HTML(title, list,
    `<h2>${title}</h2>${description}
      <img src="/images/hello.jpg" style ="width:300px; display:block; margin-top:10px;">`,
    `<a href="/create">create</a>`
  );
  res.send(html);
});
// next엔 그다음에 호출되야할 미들웨어가 담겨있음
app.get('/page/:pageId', (req, res) => {
  filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {
    if (err) {
      next(err) //err 가 있다면 인자가 4개인 미들웨어 (에러출력 미들웨어)를 찾아서 호출
    } else {
      var title = req.params.pageId;
      var sanitizedTitle = sanitizeHtml(title);
      var sanitizedDescription = sanitizeHtml(description, {
        allowedTags: ['h1']
      });
      var list = template.list(req.list);
      var html = template.HTML(sanitizedTitle, list,
        `<h2>${sanitizedTitle}</h2>${sanitizedDescription}`,
        ` <a href="/create">create</a>
            <a href="/update/${sanitizedTitle}">update</a>
            <form action="/delete_process" method="post">
              <input type="hidden" name="id" value="${sanitizedTitle}">
              <input type="submit" value="delete">
            </form>`
      );
      res.send(html);
    }

  });

});

app.get('/create', (req, res) => {
  var title = 'WEB - create';
  var list = template.list(req.list);
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
//app.post('create', (res,req)=>{
//create로 똑같이 받아서 post,get 방식에 따라 구분하기도함
app.post('/create_process', (req, res) => {
  var post = req.body;
  var title = post.title;
  var description = post.description;
  fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
    res.writeHead(302, { Location: `/page/${title}` });
    res.end();
  });
});

app.get('/update/:pageId', (req, res) => {
  filteredId = path.parse(req.params.pageId).base;
  fs.readFile(`data/${filteredId}`, 'utf8', (err, description) => {
    var title = req.params.pageId;
    var list = template.list(req.list);
    var html = template.HTML(title, list,
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
      `<a href="/create">create</a> <a href="/update/${title}">update</a>`
    );
    res.send(html);
  });

});

app.post('/update_process', (req, res) => {
  var post = req.body;
  var id = post.id;
  var title = post.title;
  var description = post.description;
  fs.rename(`data/${id}`, `data/${title}`, (error) => {
    fs.writeFile(`data/${title}`, description, 'utf8', (err) => {
      res.redirect(`/?id=${title}`)
    })
  });

});
app.post('/delete_process', (req, res) => {
  var post = req.body;
  var id = post.id;
  var filteredId = path.parse(id).base;
  fs.unlink(`data/${filteredId}`, (err) => {
    res.redirect('/');
  });
})

app.use(function (req, res, next) {
  res.status(404).send('Sorry cant find that!');
});

//4개의 인자를 가지고 있는 함수는 에러를 처리하기로 약속
app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
