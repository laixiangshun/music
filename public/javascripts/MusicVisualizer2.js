/**
 * Created by lailai on 2017/5/23.
 */

function MusicVisualizer2(options){
    //播放过的bufferSource的对象
    this.buffer = {};

    //当前正在播放的bufferSource
    this.source = null;

    //通过audio标签创建MediaaudioElementSourceNode时使用的audio元素
    this.audio = new Audio();
    this.audioSource = MusicVisualizer2.ac.createMediaElementSource(this.audio);

    //选择过的资源数的累计值
    this.count = 0;

    //播完后的回调
    this.onended = options.onended;

    //unit8Array的长度
    this.size = options.size || 32;

    //可视化调用的绘图函数
    this.visualizer = options.visualizer;

    //初次加载第一首音乐成功时回调函数，针对苹果禁止自动播放用
    this.initCallback = null;

    //控制音量的GainNode
    this.gainNode = MusicVisualizer2.ac[MusicVisualizer2.ac.createGain ? "createGain" : "createGainNode"]();

    //音频分析对象
    this.analyser = MusicVisualizer2.ac.createAnalyser();

    //延迟对象
    this.delayNode = MusicVisualizer2.ac.createDelay(179);

    typeof options.delay === 'number' && (this.delayNode.delayTime.value = options.delay);
    //this.delayNode.delayTime.value = 5;

    this.analyser.connect(this.delayNode);

    this.delayNode.connect(this.gainNode);

    this.gainNode.connect(MusicVisualizer2.ac.destination);

    //xhr对象
    this.xhr = new window.XMLHttpRequest();

    MusicVisualizer2.visualize(this);
}

MusicVisualizer2.ac = new (window.AudioContext ||window.webkitAudioContext || window.mozAudioContext)();

//检测是否为function
MusicVisualizer2.isFunction = function(fun){
    return Object.prototype.toString.call(fun) == "[object Function]";
};

/*从指定的路径加载音频资源
 *@param xhr XMLHttpRequest
 *@param path string,音频资源路径
 *@param fun function,decode成功后的回调函数，将arraybuffer作为this
 */
MusicVisualizer2.load = function(xhr, path, fun){
    xhr.abort();
    xhr.open("GET", path, true);
    xhr.responseType = "arraybuffer";

    xhr.onload = function(){
        MusicVisualizer2.isFunction(fun) && fun(xhr.response);
    };
    xhr.send();
};

//播放mv对象的source,mv.onended为播放结束后的回调
MusicVisualizer2.play = function(mv){

    mv.source.connect(mv.analyser);
    //mv.source[mv.source.start ? "start" : "noteOn"](0);
    if(mv.source === mv.audioSource){
        mv.audio.play();
        mv.audio.onended = mv.onended;
    }else{
        //兼容较老的API
        mv.source[mv.source.start ? "start" : "noteOn"](0);

        //为该bufferSource绑定onended事件
        MusicVisualizer2.isFunction(mv.onended) && (mv.source.onended = mv.onended);
    }

};

//停止mv.source
MusicVisualizer2.stop = function(mv){
    if(mv.source === mv.audioSource){
        mv.audio.pause();
        mv.audio.onended = window.undefined;
    }else{
        //兼容较老的API
        mv.source[mv.source.stop ? "stop" : "noteOff"](0);

        //停止后移除之前为mv.source绑定的onended事件
        mv.source.onended = window.undefined;
    }
};

/*可视化当前正在播放的音频
 *@param mv MusicVisualizer,MusicVisualizer的实例对象
 */
MusicVisualizer2.visualize = function(mv){
    mv.analyser.fftSize = mv.size * 2;
    var arr = new Uint8Array(mv.analyser.frequencyBinCount);

    var requestAnimationFrame = window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.mzRequestAnimationFrame;
    var oldav = 0;
    function v(){
        mv.analyser.getByteFrequencyData(arr);
        var av = Math.round(100 * Array.prototype.reduce.call(arr, function(x, y){return x + y}) / mv.size / 256);
        var dlav = av - oldav;
        oldav = av;
        //将分析得到的音频数据传递给mv.visualizer方法可视化
        mv.visualizer(arr, dlav, av);
        requestAnimationFrame(v);
    }

    MusicVisualizer2.isFunction(mv.visualizer) && requestAnimationFrame(v);
};

//将arraybuffer数据decode得到buffer
//成功后将bufferSourceNode作为fun回调的this
MusicVisualizer2.prototype.decode = function(arraybuffer, fun){
    var self = this;
    MusicVisualizer2.ac.decodeAudioData(arraybuffer, function(buffer){
        var bufferSourceNode = MusicVisualizer2.ac.createBufferSource();
        bufferSourceNode.buffer = buffer;
        fun(bufferSourceNode);
    },function(err){
        console.log(err);
    })
};

MusicVisualizer2.prototype.play = function(path){
    var self = this;
    var count = ++self.count;

    //停止当前正在播放的bufferSource
    self.source && MusicVisualizer2.stop(self);

    if(path instanceof ArrayBuffer){
        self.decode(path, function(buffer){
            //self.initCallback && !self.source && MusicVisualizer2.isFunction(self.initCallback) && self.initCallback();
            self.source = buffer;
            MusicVisualizer2.play(self);
        });
    }
    if(typeof(path) === 'string'){

        //pc上通过audio标签创建MediaaudioElementSourceNode，比ajax请求再解码要快
       /* if(!isMobile){
            //self.audio.src = path;
            self.audio = new Audio(path);
            self.audioSource = MusicVisualizer.ac.createMediaElementSource(self.audio);
            //console.log(path);

            self.initCallback && !self.source && MusicVisualizer.isFunction(self.initCallback) && self.initCallback();

            self.source = self.audioSource;

            MusicVisualizer.play(self);

            return;
        }*/

        //安卓iphone等移动设备上使用ajax请求arraybuffer再解码
        //安卓iphone等移动设备上audio播放流似乎没被re-routed到audioContext中
        if(path in self.buffer){
            MusicVisualizer2.stop(self.source);

            var bufferSource = MusicVisualizer2.ac.createBufferSource();
            bufferSource.buffer = self.buffer[path];
            self.source = bufferSource;
            MusicVisualizer2.play(self);
        }else{
            MusicVisualizer2.load(self.xhr, path, function(arraybuffer){

                if(count != self.count)return;

                self.decode(arraybuffer, function(buffer){

                    if(count != self.count)return;

                    //将decode好的buffer缓存起来
                    //self.buffer[path] = this.buffer;

                   // self.initCallback && !self.source && MusicVisualizer2.isFunction(self.initCallback) && self.initCallback();

                    self.source = buffer;

                    MusicVisualizer2.play(self);
                });
            })
        }
    }
};

//直接播放当前的bufferSource，在苹果设备用户触发时调用
MusicVisualizer2.prototype.start = function(){
    if(this.source === this.audioSource){
        this.audio.play();
    }else{
        this.source && this.source[this.source.start ? "start" : "noteOn"](0);
    }
};

//应用加载完毕，为苹果设备添加用户触发的事件
MusicVisualizer2.prototype.addinit = function(fun){
    this.initCallback = fun;
};

//音量调节
MusicVisualizer2.prototype.changeVolume = function(rate){
    this.gainNode.gain.value = rate * rate;
};
