function responseFormatter(req, res, next) {
  res.formatResponse = (data = {}, message = '', success = true) => {
    res.json({ success, data, message });
  };
  next();
}

module.exports = responseFormatter;
