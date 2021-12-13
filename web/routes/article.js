var express = require('express');
var router = express.Router();

/* GET advertisement page. */
router.get('/:id', function(req, res, next) {
  res.render('Article', { title: `Article ${req.params.id}` });
});

module.exports = router;
