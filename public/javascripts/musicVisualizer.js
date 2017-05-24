/**
 * Created by lailai on 2017/5/22.
 */
/* webAudio核心功能封装为对象 */
function MusicVisualizer(obj) {
    //播放过的bufferSource的对象
    this.buffer = {};
    this.source = null; //BufferSource节点

    this.count = 0; //点击次数

    this.analyser = MusicVisualizer.ac.createAnalyser(); //音频分析对象
    this.size = obj.size; //分析时得到的数据大小
    this.analyser.fftSize = this.size * 2; //设置FFT的大小(用于将一个信号变换到频域，默认是2048)

    this.gainNode = MusicVisualizer.ac[MusicVisualizer.ac.createGain ? "createGain" : "createGainNode"](); //音量节点
    this.gainNode.connect(MusicVisualizer.ac.destination); //所有音频输出聚集地

    this.analyser.connect(this.gainNode);

    this.xhr = new XMLHttpRequest(); //Ajax

    this.visualizer = obj.visualizer; //draw可视化

    this.visualize(); //自执行
}
MusicVisualizer.ac = new(window.AudioContext || window.webkitAudioContext)();
MusicVisualizer.prototype.load = function(url, fun) { //加载
    this.xhr.abort(); // 终止之前的异步请求
    this.xhr.open('GET', url);
    this.xhr.responseType = "arraybuffer"; //音频数据以二进制形式返回，便于解压缩
    var that = this;
    this.xhr.onload = function() {
        fun(that.xhr.response);
    };
    this.xhr.send();
};

MusicVisualizer.prototype.decode = function(arraybuffer, fun) { // 解码方法
    MusicVisualizer.ac.decodeAudioData(arraybuffer, function(buffer) { // 异步解码包含在arrayBuffer中的音频数据
        fun(buffer);
    }, function(err) {
        console.log(err);
    });
   /* var self=this;
    MusicVisualizer.ac.decodeAudioData(arraybuffer,function(buffer){
        var bufferSourceNode = MusicVisualizer.ac.createBufferSource();
        bufferSourceNode.buffer = buffer;
        fun.call(bufferSourceNode);
    },function(err){
        console.log(err);
    })*/
};
//播放MusicVisualizer对象的方法
MusicVisualizer.play=function(mv){
    mv.source.connect(mv.analyser);
    mv.source[mv.source.start ? "start" : "noteOn"](0);
};
MusicVisualizer.prototype.play = function(path) {
    var n = ++this.count;
    var self = this;
    /*this.source && this.source[this.source.stop ? "stop" : "noteOff"]();*/
    this.source && this.stop();
    if(path instanceof ArrayBuffer)
    {
        self.decode(path,function(){
            self.source=this;
            MusicVisualizer.play(self);
        })
    }
    if(typeof(path)=== "string") {
        if (path in self.buffer) {
            MusicVisualizer.stop(self.source);
            var bufferSource = MusicVisualizer.ac.createBufferSource();
            bufferSource.buffer = self.buffer[path];
            self.source = bufferSource;
            MusicVisualizer.play(self);
        } else {
            this.load(path, function (arraybuffer) {
                if (n != self.count) {
                    return;
                } //正常情况n和count是相等的,用到了闭包的知识
                self.decode(arraybuffer, function (buffer) {
                    if (n != self.count) {
                        return;
                    }
                    var bs = MusicVisualizer.ac.createBufferSource(); // 创建AudioBufferSourceNode对象
                    bs.connect(self.analyser);
                    bs.buffer = buffer; // 表示要播放的音频资源数据
                    //self.initCallback && !self.source && MusicVisualizer.isFunction(self.initCallback) && self.initCallback();
                    bs[bs.start ? "start" : "noteOn"](0);
                    self.source = bs;
                })
            })
        }
    }
};
MusicVisualizer.prototype.stop=function(){
    this.source[this.source.stop ? "stop" : "noteOff"](0);
};
MusicVisualizer.prototype.changeVolume = function(percent) { // 音量控制方法
    this.gainNode.gain.value = percent * percent;
};
MusicVisualizer.prototype.visualize = function() {
    var arr = new Uint8Array(this.analyser.frequencyBinCount); //实时得到的音频频域的数据个数为前面设置的fftSize的一半
    requestAnimationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame; //动画函数

    var self = this;

    function v() {
        self.analyser.getByteFrequencyData(arr); // 复制音频当前的频域数据到Unit8Array中
        //console.log(arr);
        self.visualizer(arr);
        requestAnimationFrame(v);
    }
    requestAnimationFrame(v); //动画函数
};
//应用加载完成，为苹果设备添加用户触发事件
MusicVisualizer.prototype.addinit=function(){
    this.initCallback=fun;
};
MusicVisualizer.start=function(){
    this.source[this.source.start ? "start" : "noteOn"](0);
};