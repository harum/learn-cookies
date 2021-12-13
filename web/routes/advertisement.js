var express = require('express');
var router = express.Router();

/* GET advertisement page. */
router.get('/', function(req, res, next) {
  const thirtySeconds = 1000 * 30 * 1;
  res.cookie('promo_visited', 1, { maxAge: thirtySeconds });
  res.render('advertisement', { title: 'Advertisement' });
});

module.exports = router;
