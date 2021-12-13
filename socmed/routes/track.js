var express = require('express');
var router = express.Router();

const histories = new Map();

router.post('/', function(req, res, next) {
  console.log('req.body', req.body);
  const id = (req.body.id || '').toString();
  const url = req.body.url;

  if (!id) {
    res.send('Not Tracked');
  } else {
    if (histories.get(id)) {
      histories.get(id).push(url);
    } else {
      histories.set(id, [url]);
    }

    console.log(`User with id ${id} is visiting ${url}`);
    console.log(histories.get(id));
    res.send('Tracked');
  }
});

router.get('/', function(req, res, next) {
  const id = (req.cookies.socmed_id || '').toString();
  res.render('track', {
    title: `Tracker List of ID:${id}`,
    histories: histories.get(id) || [],
  });
});

module.exports = router;
