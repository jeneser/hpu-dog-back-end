var User = require('../models/user');
var config = require('../config');
var validator = require('validator');
var jwt = require('jsonwebtoken');

/**
 * 注册
 * @param  {HttpRequest}   req
 * @param  {HttpResponse}   res
 * @param  {Function} next
 */
exports.signup = function (req, res, next) {
  var userName = validator.trim(req.body.userName).toLowerCase();
  var email = validator.trim(req.body.email).toLowerCase();
  var pass = validator.trim(req.body.pass);
  var repass = validator.trim(req.body.repass);

  // 验证信息是否正确
  if ([userName, email, pass, repass].some(function (item) {
      return item === '';
    })) {
    res.status(422).json({
      msg: '信息不完整'
    });
    return;
  }

  if (userName.length < 3) {
    res.status(422).json({
      msg: '用户名至少需要3个字符'
    });
    return;
  }

  if (!(/^([a-zA-Z0-9\-_]|[\u4e00-\u9fa5])+$/i).test(userName)) {
    res.status(422).json({
      msg: '用户名不合法'
    });
    return;
  }

  if (!validator.isEmail(email)) {
    res.status(422).json({
      msg: '请填写正确的邮箱'
    });
    return;
  }

  if (pass !== repass) {
    res.status(422).json({
      msg: '两次输入密码不一致'
    });
    return;
  }

  // 验证信息是否已存在
  User.findOne({
    userName: userName
  }, function (err, user) {
    if (err) {
      return next(err);
    }

    if (user) {
      res.status(422).json({
        msg: '用户名已存在'
      });
      return;
    } else {
      // 生成token
      var token = jwt.sign({
        userName: userName,
        role: 0
      }, config.authentication.privateKey);

      var userModel = new User({
          userName: userName,
          email: email,
          pass: pass,
          token: token
        })
        .save()
        .then(function (val) {
          res.json({
            msg: '注册成功',
            user: userName,
            token: token
          });
        });
    }
  });
}

/**
 * 登陆授权
 * @param  {HttpRequest}   req
 * @param  {HttpResponse}   res
 * @param  {Function} next
 */
exports.signin = function (req, res, next) {
  var userName = validator.trim(req.body.userName).toLowerCase();
  var pass = validator.trim(req.body.pass);

  if ([userName, pass].some(function (item) {
      return item === '';
    })) {
    res.status(422).json({
      msg: '信息不完整'
    });
    return;
  }

  if (userName.length < 3) {
    res.status(422).json({
      msg: '用户名至少需要5个字符'
    });
    return;
  }

  if (!(/^([a-zA-Z0-9\-_]|[\u4e00-\u9fa5])+$/i).test(userName)) {
    res.status(422).json({
      msg: '用户名不合法'
    });
    return;
  }

  User.findOne({
    userName: userName
  }, function (err, user) {
    if (err) {
      return next(err);
    }

    user.comparePass(pass, function (err, isMatch) {
      if (isMatch) {
        res.json({
          type: true,
          user: user.userName,
          token: user.token
        });
      } else {
        res.status(422).json({
          type: false,
          msg: '登陆失败'
        });
      }
    });
  });
}
