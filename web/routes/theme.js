var express = require('express');
var router = express.Router();

/* GET advertisement page. */
router.get('/', function(req, res, next) {
  const oneMonth = 1000 * 60 * 60 * 24 * 30;
  // res.cookie('theme', 'dark', {
  //   maxAge: oneMonth,
  //   hostOnly: false,
  //   httpOnly: false,
  //   SameSite: 'None',
  // });

  // same site non must use secure
  res.setHeader('set-cookie', [
    'theme=dark;' +
    ' Max-Age=' + oneMonth + ';' +
    ' Path=/;' +
    'Secure;' + // same site none must use secure
    ' SameSite=None;' +
    ' Domain=weblocal.com',
  ]);

  res.render('theme', {
    title: 'Theme',
  });
});

module.exports = router;
