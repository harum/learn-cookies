var express = require('express');
var router = express.Router();

/* GET advertisement page. */
router.get('/', function(req, res, next) {
  res.render('galery', { title: 'Galery' });
});

module.exports = router;
