/**
 * Created by kevin on 15-5-8.
 * @description define the action of control bar
 *
 * @author Kevin Tan
 *
 * @constructor controls.init
 */
var Player = require('./model/player_backup');
var controls = {
    orderList: ['repeat', 'refresh', 'align-justify', 'random'],
    init: function () {
        //初始化播放器
        this.player = Player;
        Player.init($('audio')[0]);
        this.$ = {
            play: $('#play'),
            pause: $('#pause'),
            order: $('#order span'),
            volPanel: $('#vol-icon'),
            volPop: $('#vol-pop'),
            volume: $('#volume'),
            songPic: $('#song-pic')
        }
        this.ID = 0;
        this.playlist = null;
        this.setState(-1);
        this.listen(this);
        this.addGlobalEvent();
    },
    addGlobalEvent: function () {
        global.on('playerPlay', function () {
            if (this.playlist == null || this.playlist.ID == -1) {
                //如果当前列表没有选中
                return;
            }
            if (arguments.length)
                this.setState.apply(this, arguments);
            this.$.play.hide();
            this.$.pause.show();
            this.player.play();
        }, this);
        global.on('playerPause', function () {
            this.$.play.show();
            this.$.pause.hide();
            this.player.pause();
        }, this);
        global.on('playerStop', function () {
            global.emit('playerPause');
            this.setState(0, 0);
        }, this);
        global.on('playerExit', function () {
            global.emit('playerStop');
            this.setState(-1);
            this.playlist = null;
        }, this);
    },
    /**
     * play next music on the playlist
     */
    forward: function () {
        global.emit('Play', 2, 1);
    },
    /**
     * play pre music on the playlist
     */
    backward: function () {
        global.emit('Play', 2, -1);
    },
    /**
     * set cur mode to the 'mode'th playMode:single-repeat->list-repeat->no-repeat->random
     *
     * @param {number} [mode] if no exists,set cur mode to the next mode;
     */
    order: function (mode) {
        var len = this.orderList.length;
        if (!utils.isNumber(mode)) {
            this.ID = (this.ID + 1) % len;
            var tag = this.orderList[this.ID];
            this.$.order.attr('class', 'glyphicon glyphicon-' + tag);
        } else {
            this.ID = (mode - 1 + len) % len;
            this.order();
        }
    },
    /**
     * change the play state and control progress
     *
     * @param {number} type - type of operation,
     * 0:play current music at 'data' second,
     * 1:play song in 'data',
     * 2:play song in "playlist.next('data')".
     * @param {number|object} [data]
     */
    setState: function (type, data) {
        switch (type) {
            case 0:
                progress.setState(data);
                this.player.setTime(data);
                break;
            case 1:
                progress.setState(0, 0, data.title);
                this.player.setSrc(data.src);
                if (data.pic) {
                    this.$.songPic.attr('src', data.pic);
                } else {
                    this.$.songPic.attr('src', 'assets/img/Ever%20Eternity.jpg');
                }
                break;
            case 2:
                var _data = this.playlist.next(data);
                this.setState(1, _data);
                break;
            default:
                global.emit('playerStop');
                data = data || "未选择歌曲";
                this.$.songPic.attr('src', 'assets/img/Ever%20Eternity.jpg');
                progress.setState(0, 0, data);
        }
    },
    /**
     * figure out the position of volume panel before display
     */
    volPanel: function () {
        var offs = this.$.volPanel.offset();
        this.$.volPop.css("top", (offs.top - 40) + 'px');
        this.$.volPop.css("left", (offs.left - 70) + 'px');
        //controls._volPop.offset({top: offs.top - 50, left: offs.left - 70});
        this.$.volPop.fadeIn(100);
        this.$.volume.focus();
    },
    listen: function (that) {
        this.$.volume.on('focusout', function () {
            that.$.volPop.fadeOut(200);
        });
        $(window).resize(function () {
            if (that.$.volPop.css('display') == 'block') {
                that.$.volPop.fadeOut(200);
            }
        });
        this.$.volume.on('change', function () {
            that.player.setVolume($(this).val());
        });

        this.player.event(function (msg) {
            switch (msg) {
                case 'ended':
                    global.emit('progressHalt');
                    global.emit('playerPlay', that.ID, that.ID ? 2 : 0);
                    break;
                case 'play':
                    global.emit('progressMove');
                    break;
                case 'error':
                    that.setState(-1, '糟糕，该文件路径失效了！');
                    break;
                case 'pause':
                    global.emit('progressHalt');
                    break;
                default:
                    //音频元数据加载完成，初始化progress
                    progress.setState(that.player.getTime(), that.player.getDuration());
            }
        });
    }
}
