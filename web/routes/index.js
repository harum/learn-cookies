var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {
    title: 'Express',
    promoVisited: req.cookies.promo_visited,
    theme: req.cookies.theme,
    fontSize: req.cookies.font_size,
  });
});

module.exports = router;
