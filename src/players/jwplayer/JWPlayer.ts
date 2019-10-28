import {AbstractPlayer} from "../../abstracts/AbstractPlayer";
import {Player} from "../../decorators/Player";
import {JWPlayerConfiguration} from "./JWPlayerConfiguration";
import {GenericPlayer} from "../generic/GenericPlayer";
import {jwplayer, JWPlayerPlayer, jwplayerType} from "./JWPlayerTypes";

@Player()
class JWPlayer extends AbstractPlayer {

    private config: JWPlayerConfiguration = GenericPlayer.config.jwPlayer;
    private player: Promise<JWPlayerPlayer> | null = null;

    constructor(element: HTMLElement) {
        super(element);
        if(this.config.player === '') {
            console.warn('JWPlayer needs to configure the player-api. Please set `GenericPlayer.config.jwPlayer.player`');
            return;
        }

        this.player = this.loadPlayerAPI().then(jwplayer => {
            const player = jwplayer(this.getId());
            player.setup({
                playlist: this.element.getAttribute('src')
            });
            return player;
        });
        this.player.then(() => this.loadingComplete());
    }

    private loadPlayerAPI(): Promise<jwplayerType> {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.config.player;
            script.addEventListener('load', () => {
                setTimeout(() => resolve((window as any).jwplayer), 100);
            });
            script.addEventListener('error', () => reject(jwplayer));
            document.body.appendChild(script);
        });
    }

    static validate(element: HTMLElement): boolean {
        if (element instanceof HTMLVideoElement) {
            const
                url: string = element.src,
                validator = /https\:\/\/cdn\.jwplayer\.com\/v2\/playlists\/([0-9a-zA-Z]+)(\?format=[0-9a-zA-Z]+)?$/;
            return validator.test(url);
        }
        return false;
    }

    getElement(): Promise<HTMLElement> {
        if(this.player) {
            return this.player.then(jwplayer => jwplayer.getContainer());
        }
        return Promise.resolve(this.element);
    }

    mute(): void {
        if(this.player) {
            this.player.then(jwplayer => jwplayer.setMute(true));
        }
    }

    pause(): void {
        if(this.player) {
            this.player.then(jwplayer => jwplayer.pause());
        }
    }

    play(): void {
        if(this.player) {
            this.player.then(jwplayer => jwplayer.play());
        }
    }

    stop(): void {
        if(this.player) {
            this.player.then(jwplayer => jwplayer.stop());
        }
    }

    unmute(): void {
        if(this.player) {
            this.player.then(jwplayer => jwplayer.setMute(false));
        }
    }

}