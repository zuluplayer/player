# GenericPlayer

The GenericPlayer is an interface to manage easily videos from different sources.


__Currently supported platforms:__

* YouTube
* Vimeo
* JW Player
* dailymotion
* standard html-videos



## How to install

```bash
npm install --save @codeecke/generic-player
```

or

```bash
yarn add @codeecke/generic-player
```



## How to use

### automatic mode

I have implement an autoloader. If you want to use it, you do it like this:

```javascript
import {GenericPlayer} from '@codeecke/generic-player';
GenericPlayer.autoload();
```

Now you you can use videos from different sources in your html-code like this:

````html
<video src="https://youtu.be/aqz-KE-bpKQ" autoplay></video>
````

The GenericPlayer will automatically replace this video-tag with the correct platform-player (youtube in this case)



### script-mode

Of course you can use this GenericPlayer in your script.

````javascript
import {GenericPlayer} from '@codeecke/generic-player';

const videoTag = document.getElementById('player'),
      player = new GenericPlayer(videoTag);

player.mute();
player.play();
````
For more informations look into the [documentation](https://github.com/codeecke/generic-player/wiki)



### The easiest way to insert videos with GDPR-consent-dialog

#### HTML

````html
<video data-src="https://youtu.be/aqz-KE-bpKQ"></video>
````

It's important to use `data-src`instead of `src`. Otherwise the browser will try to load this video automatically.

#### SCSS

```scss
@import "~@codeecke/generic-player/dist/scss/ConsentManager";
```

#### JavaScript

```javascript
import {GenericPlayer} from '@codeecke/generic-player';

// configure the consent-message
// @see https://github.com/codeecke/generic-player/wiki/ConfigurationManager#consent
GenericPlayer.config.consent.enabled = true;
GenericPlayer.config.consent.content.info = 'Your privacy policy';
GenericPlayer.config.consent.content.accept = 'Your label for the accept-button';

// starts the automatic parsing of video-tags
GenericPlayer.autoload();
```
