var UIObject = require('../../base/ui_object');
var _ = require('underscore');

var Playlist = UIObject.extend({
  name: 'Playlist',
  initialize: function(options) {
    this.containers = options.containers || [];
    this.current = options.current || 0;
    this.settings = this.getCurrentContainer().settings;
    _.each(this.containers, this._setupContainers, this);
    this.getCurrentContainer().$el.show();
    this._bindContainerEvents(this.getCurrentContainer());
  },
  getCurrentContainer: function() {
    return this.containers[this.current];
  },
  getNextContainer: function() {
    this.current = ++this.current % this.containers.length;
    var nextContainer = this.containers[this.current];
    this.settings = nextContainer.settings;
    return nextContainer;
  },
  hasPlugin: function(name) {
    //fixme
    return false;
  },
  ready: function() {
    this.trigger('container:ready');
  },
  enableMediaControl: function() {
    this.trigger('container:mediacontrol:enable');
  },
  disableMediaControl: function() {
    this.trigger('container:mediacontrol:disable');
  },
  animate: function(style, duration) {
    this.getCurrentContainer().$el.animate(style, duration);
  },
  setStyle: function(style) {
    this.getCurrentContainer().$el.css(style);
  },
  _setupContainers: function(container) {
    container.$el.hide();
    //this._injectInChildPlugins(container.plugins);
  },
  _injectInChildPlugins: function(plugins) {
    _.each(plugins, function(plugin) {
      plugin.stopListening();
      plugin.container = this;
      plugin.bindEvents();
    }, this);
  },
  _bindContainerEvents: function(container) {
    this.listenTo(container, 'container:ended', this.playNextContainer);
    this.listenTo(container, 'container:timeupdate', this.timeUpdateProxy);
    this.listenTo(container, 'container:progress', this.progressProxy);
  },
  getPlaybackType: function() {
    return this.getCurrentContainer().getPlaybackType();
  },
  length: function() {
    return this.containers.length;
  },
  playNextContainer: function() {
    this.getCurrentContainer().$el.hide();
    this.stopListening(this.getCurrentContainer());
    var nextContainer = this.getNextContainer();
    this.trigger('container:next', this.current);
    this._bindContainerEvents(nextContainer);
    if(this.current === 0) {
      nextContainer.$el.show();
      this.trigger('container:ended');
      nextContainer.stop();
    } else {
      nextContainer.play();
      this.trigger('container:play', this.name);
      this.trigger('container:settingsupdate', this.name);
      this.trigger('container:timeupdate', 0, nextContainer.playback.getDuration());
      nextContainer.$el.show();
    }
  },
  timeUpdateProxy: function(position, duration) {
    this.trigger('container:timeupdate', position, duration, this.name);
  },
  jumpToContainer: function(index) {
    this.getCurrentContainer().$el.hide();
    this.stopListening(this.getCurrentContainer());
    this.getCurrentContainer().stop();
    this.current = index;
    this._bindContainerEvents(this.containers[index]);
    this.getCurrentContainer().$el.show();
    this.getCurrentContainer().play();
  },
  play: function() {
    this.getCurrentContainer().playback.play();
    this.getCurrentContainer().$el.show();
    this.trigger('container:play', this.name);
  },
  setVolume: function(value) {
    this.trigger('container:volume', value, this.name);
    this.getCurrentContainer().setVolume(value);
  },
  pause: function() {
    this.getCurrentContainer().pause();
    this.trigger('container:pause', this.name);
  },
  stop: function() {
    this.getCurrentContainer().stop();
    this.trigger('container:stop', this.name);
  },
  playing: function() {
    this.trigger('container:playing', this.name);
  },
  progress: function(startPosition, endPosition, duration) {
    this.trigger('container:progress', startPosition, endPosition, duration);
  },
  setCurrentTime: function(time) {
    this.getCurrentContainer().setCurrentTime(time);
  },
  settingsUpdate: function() {
    this.settings = this.getCurrentContainer().settings;
    this.trigger('container:settingsupdate');
  },
  isPlaying: function() {
    return this.getCurrentContainer().isPlaying();
  },
  destroy: function() {
    this.current = 0;
    this.trigger('container:next', 0);
    this.trigger('container:destroy');
    _.invoke(this.containers, 'destroy');
  },
  statsReport: function() {
    //fix me
  },
  render: function() {
    return this;
  }
});

module.exports = Playlist;

