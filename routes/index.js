var express = require('express');
var router = express.Router();
var multer=require('multer');
var path=require('path');//加载path中间件，处理路径
var media=path.join(__dirname,'../public/media');
/*var upload=multer({dest: path.join(__dirname,'../public/upload')});*/
var upload=multer({dest: 'public/upload/'});
/* GET home page. */
router.get('/', function(req, res, next) {
  var fs=require('fs');
  fs.readdir(media,function(err,names){
    if(err)
    {
      console.log(err);
    }else
    {
      res.render('index3', { title: 'MyMusic',music: names});
    }
  });
});

router.get('/index',function(req,res,next){
  res.render('index4',{title: 'index'});
});

router.post('/upload',upload.single('image'),function(req,res,next){
 /* upload.single("image");*///单个文件上传，获取文件：req.file
  /*upload.array('image',maxCount)*///image为多个相同文件name，maxCount为最大上传个数，也可不设置
  /*upload.array([{name: 'image',maxCount: count},{name: 'txt',maxCount: count2}])*///获取文件为：req.files.image
  var image=req.file.path;
  res.render('index4',{
    title: 'multer',
    image: image
  });
});
module.exports = router;
