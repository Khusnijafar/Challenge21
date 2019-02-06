var express = require('express');
var bodyParser = require('body-parser');
var path = require('path');
var moment = require('moment');

var app = express();

var pg = require('pg');

var conString = "postgres://postgres:12345@localhost/cruddb";

var pool = new pg.Client(conString);
pool.connect();
//console.log(pool);

//module.exports = pool;

// const { Pool, Client } = require('pg')
// const connectionString = 'postgresql://dbuser:secretpassword@database.server.com:3211/mydb'

// const pool = new Pool({
//   connectionString: connectionString,
// })

//var db = pgp('postgres://username:password@host:port/database')
// pool.on('connect', () => {
//     console.log('connected to the db');
//   });


// const {Pool}  = require('pg');

// var pool = new Pool({
//   user: 'postgres',
//   host: 'localhost',
//   database: 'cruddb',
//   password: '12345',
//   port: 5432
// })
// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'))

// Body Parser Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: false
}));

//Set Static Path
app.use(express.static(path.join(__dirname, 'public')))

// berkunjung ke router http://localhost:3000/
app.get("/", (req, res) => {
  let params = [];
  let filter = false;
  let page = req.query.page || 1;
  let limitpage = 4;
  let offset = (page - 1) * limitpage;
  let url = req.url == '/' ? '/ ? page=1' : req.url

  if (req.query.checkid && req.query.id) {
    params.push(`id = ${req.query.id}`);
    filter = true;
  }
  if (req.query.checkstring && req.query.string) {
    params.push(`string like '%${req.query.string}%'`);
    filter = true;
  }
  if (req.query.checkinteger && req.query.integer) {
    params.push(`integer = ${req.query.integer}`);
    filter = true;
  }
  if (req.query.checkfloat && req.query.float) {
    params.push(`float = ${req.query.float}`);
    filter = true;
  }
  if (req.query.checkdate && req.query.startdate && req.query.enddate) {
    params.push(`date between '${req.query.startdate}' and '${req.query.enddate}'`);
    filter = true;
  }
  if (req.query.checkboolean && req.query.boolean) {
    params.push(`boolean = '${req.query.boolean}'`);
    filter = true;
  }
  let sql = `select count(*) as total from form `;
  if (filter) {
    sql += ` where ${params.join(' and ')}`
    // console.log(sql);
  }
  pool.query(sql, (err, count) => {
    let total = count[0];
    const pages = Math.ceil(total / limitpage);
    sql = `select * from form `;
    if (filter) {
      sql += ` where ${params.join(' and ')}`
    }
    sql += ` limit ${limitpage} offset ${offset}`;
    pool.query(sql, (err, row) => {
     // `select * from form order by id asc`
      // console.log(row['rows']);
      res.render('index', {
        form: row['rows'],
        query: req.query,
        page,
        moment,
        pages,
        url
      });
    });
  });
})
// db.all("select * from data", (err, rows) => {
//     if (err) throw err;
//     res.render("index", {
//       data: rows
//     });
//   });
// });

// berkunjung ke router http://localhost:3000/add
app.get("/add", (req, res) => {
  res.render("add");
});

// function getData(cb) {
//   pool.query("select * from form", (err, rows) => {
//     if (err) throw err;
//     cb(rows);
//   });
// }

app.get("/edit/:id", (req, res) => {
  let id = req.params.id;
  pool.query(`select * from form where id = ${id} limit 1`, (err, data) => {
    if (err) throw err;
    res.render("edit", {
      item: data.rows[0],
      moment
    });
  });
});

// berkunjung ke router http://localhost:3000/add dengan metode post
app.post("/add", (req, res) => {
  pool.query(
    `insert into form(string, integer, float, date, boolean) values('${
       req.body.string
     }',${req.body.integer},${req.body.float},'${req.body.date}','${
       req.body.boolean
     }')`,
    err => {
      if (err) throw err;
      res.redirect("/");
    }
  );
});

app.post("/edit/:id", (req, res) => {
  pool.query(
    `update form set (string, integer, float, date, boolean) = ('${
    req.body.string}',${req.body.integer},${req.body.float},'${req.body.date}',
    '${req.body.boolean}') where id= ${req.params.id}`,
    err => {
      if (err) throw err;
      res.redirect("/");
    }
  );
});

app.get("/delete/:id", function (req, res) {
  pool.query(`delete from form where id = ${req.params.id}`, err => {
    if (err) throw err;
    res.redirect("/");
  });
});

app.listen(3000, function () {
  console.log('Server Started on Port 3000...');

})