/**
 * Created by lailai on 2017/5/23.
 */
/**
 * Created by lailai on 2017/5/22.
 */
/**
 * Created by lailai on 2017/5/22.
 * 调用封装的MusicVisualizer对象方法
 */
//处理请求，获取音乐数据
function $(s){
    return document.querySelectorAll(s);
}
var size=64;
var box=$("#box")[0];
var width,height;
var canvas=document.createElement("canvas");
var ctx=canvas.getContext("2d");
box.appendChild(canvas);

var Dots=[];
var line;

//封装的对象
var mv = new MusicVisualizer2({
    size: size,
   /* onended: function(){
        if($(".play")){
            $(".play").nextElementSibling ? $(".play").nextElementSibling.click() : lis[0].click();
        }else{
            lis[0].click();
        }
    },*/
    visualizer: draw
});
var lis=$('#list li');
for(var i=0;i<lis.length;i++)
{
    lis[i].onclick=function(){
        for(var j=0;j<lis.length;j++)
        {
            lis[j].className="";
        }
        this.className="selected";
        // load("/media/"+this.title);
        mv.play("/media/"+this.title);
    }
}
lis[0].click();//默认播放第一首

function random(m,n){//随机生成两个数之间的数
    return Math.round(Math.random()*(n-m)+m);
}
//获取点的坐标信息和颜色信息
function getDots(){
    Dots=[];
    for(var i=0;i<size;i++)
    {
        var x=random(0,width);
        var y=random(0,height);
        var color="rgba("+random(0,255)+","+random(0,255)+","+random(0,255)+",0.1)";
        Dots.push({
            x: x,
            y: y,
            dx: random(1,4),
            color: color,
            cap: 0
        });
    }
}

function resize(){
    height=box.clientHeight;
    width=$("body")[0].clientWidth;
    /* width=box.clientWidth;*/
    canvas.height=height;
    canvas.width=width;
    line=ctx.createLinearGradient(0,0,0,height);
    line.addColorStop(0,"red");
    line.addColorStop(0.5,"yellow");
    line.addColorStop(1,"green");

    getDots();
}
resize();

window.onresize=resize;//浏览器窗口改变时调用

function draw(arr){
    ctx.clearRect(0,0,width,height);//清除
    var w=width/size;
    var cw=w*0.6;
    var caph=cw >10? 10:cw; //设置小帽的高度不超过10px
    ctx.fillStyle=line;
    for(var i=0;i<size;i++)
    {
        var o=Dots[i];
        if(draw.type=="column"){
            var h=arr[i]/256 * height;
            ctx.fillRect(w*i,height-h,w*0.6,h);//绘制矩形柱状图
            ctx.fillRect(w*i,height-(o.cap+caph),cw,caph);//绘制矩形柱状图小帽
            o.cap--;
            if(o.cap < 0)
            {
                o.cap=0;
            }
            if(h>0 && o.cap<h+40)
            {
                o.cap=h+40 >height-caph?height-caph:h+40;
            }
        }else if(draw.type=="dot"){
            ctx.beginPath();
            /* var o=Dots[i];*/
            var r=10+arr[i] / 256 *(height>width?width:height)/10;
            ctx.arc(o.x, o.y,r,0,Math.PI*2,true);
            var g=ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y,r);//绘制圆形
            g.addColorStop(0,"#fff");
            g.addColorStop(1, o.color);
            ctx.fillStyle=g;
            ctx.fill();
            //左移动
            o.x+= o.dx;
            o.x= o.x > width ? 0: o.x;
            /*ctx.strokeStyle="#fff";
             ctx.stroke();*/
        }
    }
}

draw.type="column";//在draw函数上绑定一个属性，默认显示柱状图

var type=$("#type li");
for(var i=0;i<type.length;i++)
{
    type[i].onclick=function(){
        for(var j=0;j<type.length;j++)
        {
            type[j].className="";
        }
        this.className="selected";
        draw.type=this.getAttribute("data-type");
    }
}

$("#volume")[0].onchange=function(){
    mv.changeVolume(this.value/this.max);
};
$("#volume")[0].onchange();

/*$("#add").onclick=function(){
 $("#upload").click();
 /!*return $("#upload").trigger('click');*!/
 };*/
function openFile(){
    /*$("#upload")[0].trigger("click");*/
    $("#upload")[0].click();
}
$("#upload")[0].onchange=function(){
    var file=this.files[0];
    var fr=new FileReader();
    fr.onload=function(e){
        mv.play(e.target.result);
    };
    fr.readAsArrayBuffer(file);
    for(var j=0;j<lis.length;j++)
    {
        lis[j].className="";
    }
    /* $(".paly") && ($(".play").className="");*/
};