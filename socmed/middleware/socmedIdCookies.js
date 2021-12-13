function socmedIdCookies(req, res, next) {
  console.log('socmedIdCookies');
  const oneMonth = 1000 * 60 * 60 * 24 * 30;
  const id = Math.floor(Math.random() * 10000);

  if (req.cookies.socmed_id) {
    console.log(`socmed_id ${req.cookies.socmed_id} is already assigned.`)
  } else {
    res.setHeader('set-cookie', [
      'socmed_id=' + id + ';' +
      ' Max-Age=' + oneMonth + ';' +
      ' Path=/;' +
      'Secure;' + // same site none must use secure
      ' SameSite=None;' +
      ' Domain=weblocal.com',
    ]);

    res.setHeader('set-cookie', [
      'socmed_id=' + id + ';' +
      ' Max-Age=' + oneMonth + ';' +
      ' Path=/;' +
      'Secure;' + // same site none must use secure
      ' SameSite=None;' +
      ' Domain=socmedlocal.com',
    ]);
  }
  next();
}

module.exports = socmedIdCookies;
