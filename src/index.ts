import express from "express";
import { DB } from "jason.db";
import { Logger } from "loggers";
import config from "./config.json";

let Database: DB = new DB('data.jason', { renameFile: false, writeFile: true });
Database.collection('urls', { caching: true });
Database.collection('data', { caching: true });
Database.collection('data').set('users', Database.collection('data').get('users') || [
  { name: 'firstUser', token: 'hardCodedToken', date: new Date().toLocaleString() }
])

let logger: Logger = new Logger({ debug: true, catch: true, colors: true, method: console.log, newLine: false });

type user = {
  name: string,
  token: string,
  date: string
};

type url = {
  uploader: string,
  url: string,
  time: string
};

function randomString(length: number): string {
  let chars: string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz1234567890';
  let str: string = '';
  for (let i: number = 0; i <= length; i++) {
    str += chars[Math.round(Math.random() * (chars.length - 1))];
  }
  return str;
}

function getUploader(token: string): user | any {
  return Object.values(Database.collection('data').get('users')).find((e: user) => e.token == token)
}

let app: express.Express = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/api/urls', (req, res) => {
  console.log(getUploader(req.headers.token?.toString()).name)
  res.json(Object.values(Database.collection('urls').get(undefined))
  .filter((value: url) => value.uploader == getUploader(req.headers.token?.toString()).name))
})

app.get('/U:id', (req, res, next) => {
  if(!req.params.id || !Database.collection('urls').get(req.params.id)) return next()
  else res.redirect(Database.collection('urls').get(`${req.params.id}.url`))
})

app.post('/url', (req, res) => {
  if (!getUploader(req.headers.token?.toString())) {
    logger.debug('User posted with no or incorrect token');
    res.status(400);
    res.json({
      success: false,
      message: 'Incorrect Token',
      fix: 'Use a correct token'
    });
    return;
  }

  if (!req.body.url) {
    logger.debug('User posted with no URL');
    res.status(400);
    res.json({
      success: false,
      message: 'No URL provided',
      fix: 'Include a URL'
    });
    return;
  }

  let urlObj: object = {
    uploader: 'million',
    url: req.body.url,
    time: new Date().toLocaleString()
  };

  let url: string = randomString(16);

  Database.collection('urls').set(url, urlObj);

  logger.debug('Successfully created link', url);
  res.status(200);
  res.json({
    success: true,
    link: 'http://localhost:8080/' + 'U' + url,
  });
  return;
});

app.use('*', (req, res) => res.send('aaa'));

app.listen(config.port, () => {
  logger.log('Loaded URL Shortener on Port:', config.port);
});
