import '../players';
import {AutosizeManager} from "./managers/AutosizeManager";
import {PlayerManager} from "./managers/PlayerManager";
import {ElementManager} from "./managers/ElementManager";
import {ConfigurationManager} from "./managers/ConfigurationManager";
import {PlayerConstructorInterface} from "../../abstracts/AbstractPlayer";
import {playerRegistry} from "../../registries/PlayerRegistry";
import {ConsentManager} from "./managers/ConsentManager/ConsentManager";
import {DOMContentLoadingState} from "./managers/DOMContentLoadingState";

DOMContentLoadingState.register();

export class GenericPlayer {
    public readonly autosize: AutosizeManager = new AutosizeManager(this);
    static readonly config = new ConfigurationManager();
    private playerManager: Promise<PlayerManager>;

    static registerPlayer(player: PlayerConstructorInterface) {
        playerRegistry.register(player);
    }

    static autoload() {
        if(DOMContentLoadingState.isLoaded) {
            document.body.querySelectorAll('video').forEach(videoTag => {
                new GenericPlayer(videoTag);
            });
        } else {
            DOMContentLoadingState.watch(this.autoload.bind(this));
        }
    }

    constructor(private element: HTMLElement) {
        this.playerManager = this.createPlayerManager();
        this.copyProperties();
    }

    private createPlayerManager(): Promise<PlayerManager> {
        return new Promise<PlayerManager>(resolve => {
            const consentManager = new ConsentManager(this.element, this);
            consentManager.onAccept(() => {
                setTimeout(() => {


                    if (this.element instanceof HTMLVideoElement && this.element.dataset['src']) {
                        this.element.src = this.element.dataset['src'] as string;
                    }
                    if (this.element instanceof HTMLVideoElement && this.element.dataset['poster']) {
                        this.element.poster = this.element.dataset['poster'] as string;
                    }
                    resolve(new PlayerManager(this.element));
                }, 100)
            });
        });
    }

    private copyProperties() {
        this.playerManager.then(playerManager => {
            const elementManager = new ElementManager(playerManager.getElement(), this.element);
            elementManager.copyStylingRelevantAttributes();
            if (this.element instanceof HTMLVideoElement) {
                this.autosize.enabled = true;
                this.autosize.ratio = 16 / 9;
                elementManager.controlPlayerByAttributes(playerManager);
            }
        });
    }

    public getElement(): Promise<HTMLElement> {
        return this.playerManager.then(playerManager => {
            return playerManager.getElement();
        });
    }

    play() {
        this.playerManager = this.playerManager.then(playerManager => {
            playerManager.play();
            return playerManager;
        });
    }

    pause() {
        this.playerManager = this.playerManager.then(playerManager => {
            playerManager.pause();
            return playerManager;
        });
    }

    stop() {
        this.playerManager = this.playerManager.then(playerManager => {
            playerManager.stop();
            return playerManager;
        });
    }

    mute() {
        this.playerManager = this.playerManager.then(playerManager => {
            playerManager.mute();
            return playerManager;
        });
    }

    unmute() {
        this.playerManager = this.playerManager.then(playerManager => {
            playerManager.unmute();
            return playerManager;
        });
    }

    getCurrentTime() : Promise<number> {
        return this.playerManager.then(playerManager => {
            return playerManager.getCurrentTime();
        });
    }

    setCurrentTime(seconds: number) : void {
        this.playerManager = this.playerManager.then(playerManager => {
            playerManager.setCurrentTime(seconds);
            return playerManager;
        });
    }

    addEventListener(eventName: string, callback: Function) {
        this.playerManager = this.playerManager.then(playerManager => {
            playerManager.addEventListener(eventName, callback);
            return playerManager;
        })
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
                } catch(e) {}
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