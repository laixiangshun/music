/**
 * Created by lailai on 2017/5/22.
 */
/**
 * 没有调用MusicVisualizer封装对象的方法
 * @param s
 * @returns {NodeList}
 */

//处理请求，获取音乐数据
function $(s){
    return document.querySelectorAll(s);
}
var lis=$('#list li');
for(var i=0;i<lis.length;i++)
{
    lis[i].onclick=function(){
        for(var j=0;j<lis.length;j++)
        {
            lis[j].className="";
        }
        this.className="selected";
        load("/media/"+this.title);
    }
}
var xhr=new XMLHttpRequest();
var ac=new (window.AudioContext || window.webkitAudioContext)();
var gainNode=ac[ac.createGain?"createGain":"createGainNode"]();//控制音量大小节点
gainNode.connect(ac.destination);

//音频分析对象
var analyser=ac.createAnalyser();
var size=128;
analyser.fftSize=size * 2;
analyser.connect(gainNode);

var source=null;
var count=0;

var box=$("#box")[0];
var width,height;
var canvas=document.createElement("canvas");
var ctx=canvas.getContext("2d");
box.appendChild(canvas);

var Dots=[];

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
        var color="rgb("+random(0,255)+","+random(0,255)+","+random(0,255)+")";
        Dots.push({
            x: x,
            y: y,
            color: color
        });
    }
}

var line;
function resize(){
    height=box.clientHeight;
    width=box.clientWidth;
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
    ctx.fillStyle=line;
    for(var i=0;i<size;i++)
    {
        if(draw.type=="column"){
            var h=arr[i]/256 * height;
            ctx.fillRect(w*i,height-h,w*0.6,h);//绘制矩形柱状图
        }else if(draw.type=="dot"){
            ctx.beginPath();
            var o=Dots[i];
            var r=arr[i] / 256 * 50;
            ctx.arc(o.x, o.y,r,0,Math.PI*2,true);
            var g=ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y,r);
            g.addColorStop(0,"#fff");
            g.addColorStop(1, o.color);
            ctx.fillStyle=g;
            ctx.fill();
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

function load(url){
    var n=++count;
    source && source[source.stop ? "stop": "noteOff"]();
    xhr.abort();//停止上一次请求
    xhr.open("GET",url);
    xhr.responseType="arraybuffer";
    xhr.onload=function(){
        console.log(xhr.response);
        if(n !=count) return;
        ac.decodeAudioData(xhr.response,function(buffer){
            if(n != count) return;
            var bufferScorce=ac.createBufferSource();
            bufferScorce.buffer=buffer;
            bufferScorce.connect(analyser);
            bufferScorce[bufferScorce.start?"start":"noteOn"](0);
            source=bufferScorce;
        },function(err){
            console.log(err);
        });
    };
    xhr.send();
}
function visualizer(){
    var arr=new Uint8Array(analyser.frequencyBinCount);

    //动画函数，兼容
    requestAnimationFrame=window.requestAnimationFrame ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame;
    function v(){
        analyser.getByteFrequencyData(arr);
        //console.log(arr);
        draw(arr);
        requestAnimationFrame(v);
    }
    requestAnimationFrame(v);
}
visualizer();
//改变音量
function changeVolume(percent){
    gainNode.gain.value=percent * percent;
}
$("#volume")[0].onchange=function(){
    changeVolume(this.value/this.max);
};
$("#volume")[0].onchange();