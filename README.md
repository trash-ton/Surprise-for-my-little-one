# Pink Plush Photobooth

A simple browser-based four-shot photobooth.

## Put it on GitHub Pages

1. Create a new GitHub repository.
2. Upload `index.html`, `style.css`, and `script.js`.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**.
5. Select `main` and `/ (root)`, then Save.
6. GitHub will give you a public link.

Camera access works on GitHub Pages because it uses HTTPS.

## Add your own Jellycat pictures

If you have images you want to use personally, create an `assets` folder and add the image files there.
Then you can replace the simple plush decorations in `index.html` with, for example:

    <img src="assets/your-image.png" class="character-image">

and style it in `style.css`.

The included design intentionally uses original plush-inspired decorations rather than bundled copyrighted character art.


## Custom version
This version includes the personalized qiqi landing page and the supplied cute plush/bow image as the generated photo-strip border.
