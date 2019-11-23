import '../players';
import '../../plugins';
import {AutosizeManager} from "./managers/AutosizeManager/AutosizeManager";
import {PlayerManager} from "./managers/PlayerManager";
import {ElementManager} from "./managers/ElementManager";
import {playerRegistry} from "../../registries/PlayerRegistry";
import {DOMContentLoadingState} from "./managers/DOMContentLoadingState";
import {pluginRegistry} from "../../registries/PluginRegistry";
import {PluginConfigurationType} from "../../abstracts/plugin/PluginConfigurationType";
import {PluginConstructorInterface} from "../../abstracts/plugin/PluginConstructorInterface";
import {PlayerConstructorInterface} from "../../interfaces/PlayerConstructorInterface";
import {JWPlayerConfiguration} from "../jwplayer/JWPlayerConfiguration";
import {EventDispatcher} from "../../abstracts/EventDispatcher";
import {PluginInterface} from "../../interfaces/PluginInterface";
import {HookList} from "./managers/HookList";

DOMContentLoadingState.register();


export class GenericPlayer extends EventDispatcher {
    [x: string]: any; // allows plugins to modify this Object
    static readonly preset: PluginConfigurationType = {
        jwPlayer: new JWPlayerConfiguration()
    };
    public readonly plugins: { [key: string]: PluginInterface } = {};
    public autosize: AutosizeManager;
    public readonly hook: HookList = new HookList();
    private readonly config: PluginConfigurationType;
    private readonly playerManager: Promise<PlayerManager>;

    static registerPlayer(player: PlayerConstructorInterface) {
        playerRegistry.register(player);
    }

    static registerPlugin(name: string, plugin: PluginConstructorInterface) {
        pluginRegistry.register(name, plugin);
    }

    static autoload() {
        if (DOMContentLoadingState.isLoaded) {
            const videoTags = document.body.querySelectorAll('video');
            [].slice.call(videoTags).forEach(videoTag => {
                new GenericPlayer(videoTag);
            });
        } else {
            DOMContentLoadingState.watch(this.autoload.bind(this));
        }
    }

    constructor(private element: HTMLElement, pluginConfiguration: PluginConfigurationType = GenericPlayer.preset) {
        super();
        this.config = {
            ...GenericPlayer.preset,
            ...pluginConfiguration
        };
        this.playerManager = this.initialize();
        this.autosize = new AutosizeManager(this, this.config['autosize'] || {});
    }

    private async initialize(): Promise<PlayerManager> {
        await this.applyRegisteredPlugins();
        const playerManager = await this.createPlayerManager();
        this.copyProperties(playerManager);
        return playerManager;
    }

    private createPlayerManager(): Promise<PlayerManager> {
        return this.hook.createPlayer.execute(() => {
            let playerManager: PlayerManager;

            if (this.element instanceof HTMLVideoElement && this.element.dataset['src']) {
                this.element.src = this.element.dataset['src'] as string;
            }
            if (this.element instanceof HTMLVideoElement && this.element.dataset['poster']) {
                this.element.poster = this.element.dataset['poster'] as string;
            }
            playerManager = new PlayerManager(this.element);
            playerManager.addEventListener('all', (data: any, eventName: string) => {
                this.dispatchEvent(eventName, data);
            });
            return playerManager
        }, {element: this.element}, 'createPlayer');
    }

    private copyProperties(playerManager: PlayerManager) {
        const
            elementManager = new ElementManager(playerManager.getElement(), this.element);

        elementManager.copyStylingRelevantAttributes();
        if (this.element instanceof HTMLVideoElement) {
            this.autosize.enabled = true;
            this.autosize.ratio = 16 / 9;
            elementManager.controlPlayerByAttributes(this);
        }
    }

    private async applyRegisteredPlugins() {
        const plugins = pluginRegistry.fetchAll();
        Object.keys(plugins).forEach(pluginName => {
            const
                Plugin = plugins[pluginName],
                pluginConfig = this.config[pluginName] || {};

            this.addPlugin(pluginName, new Plugin(pluginConfig));
        });
    }

    addPlugin(name: string, plugin: PluginInterface) {
        this.hook.addPlugin.execute(() => {
            this.plugins[name] = plugin;
            if (plugin instanceof EventDispatcher) {
                plugin.addEventListener('all', (data: any, eventName: string) => this.dispatchEvent(eventName, data));
            }
            plugin.apply(this);
        })
    }

    getElement(): Promise<HTMLElement> {
        return this.playerManager.then(playerManager => playerManager.getElement());
    }

    play() {
        this.hook.play.execute(async () => {
            const playerManager = await this.playerManager;
            playerManager.play();
            return playerManager;
        });
    }

    pause() {
        this.hook.pause.execute(async () => {
            const playerManager = await this.playerManager;
            playerManager.pause();
            return playerManager;
        });
    }

    stop() {
        this.hook.stop.execute(async () => {
            const playerManager = await this.playerManager;

            playerManager.stop();
            return playerManager;
        });
    }

    mute() {
        this.hook.mute.execute(async () => {
            const playerManager = await this.playerManager;

            playerManager.mute();
            return playerManager;
        });
    }

    unmute() {
        this.hook.unmute.execute(async () => {
            const playerManager = await this.playerManager;

            playerManager.unmute();
            return playerManager;
        });
    }

    getCurrentTime(): Promise<number> {
        return this.hook.getCurrentTime.execute(
            async () => (await this.playerManager).getCurrentTime()
        );
    }

    setCurrentTime(seconds: number): void {
        this.hook.setCurrentTime.execute(async () => {
            const playerManager = await this.playerManager;

            playerManager.setCurrentTime(seconds);
            return playerManager;
        });
    }

    addEventListener(eventName: string | string[], callback: Function) {
        this.hook.addEventListener.execute(() => {
            if (Array.isArray(eventName)) {
                eventName.forEach(event => super.addEventListener(event, callback));
                return;
            }

            super.addEventListener(eventName, callback);
        });
    }

    enterFullscreen() {
        this.playerManager.then(playerManager => {
            playerManager.getElement().then(el => {

                try {
                    if (el.requestFullscreen) {
                        el.requestFullscreen();
                        // @ts-ignore
                    } else if (el.mozRequestFullScreen) { /* Firefox */
                        // @ts-ignore
                        el.mozRequestFullScreen();
                        // @ts-ignore
                    } else if (el.webkitRequestFullscreen) { /* Chrome, Safari and Opera */
                        // @ts-ignore
                        el.webkitRequestFullscreen();
                        // @ts-ignore
                    } else if (el.msRequestFullscreen) { /* IE/Edge */
                        // @ts-ignore
                        el.msRequestFullscreen();
                    }
                } catch (e) {
                }
            })
        });
    }

    exitFullscreen() {
        this.playerManager.then(playerManager => {
            playerManager.getElement().then(el => {

                if (document.exitFullscreen) {
                    document.exitFullscreen();
                    // @ts-ignore
                } else if (document.mozCancelFullScreen) { /* Firefox */
                    // @ts-ignore
                    document.mozCancelFullScreen();
                    // @ts-ignore
                } else if (document.webkitExitFullscreen) { /* Chrome, Safari and Opera */
                    // @ts-ignore
                    document.webkitExitFullscreen();
                    // @ts-ignore
                } else if (document.msExitFullscreen) { /* IE/Edge */
                    // @ts-ignore
                    document.msExitFullscreen();
                }
            })
        });
    }
}