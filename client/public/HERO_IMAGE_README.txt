Home.jsx expects a hero background image at exactly this path:

    client/public/hero-farmer-market.jpg

I could not generate that image myself (no image-generation tool available
in the environment I built this in), so this file is a placeholder
reminder, not the actual image.

The photo you described — an Ethiopian farmer and buyer shaking hands, a
bustling local market in the background with baskets of coffee, teff, and
fresh produce, sunset over the mountains, warm tones, background softly
blurred — needs to be generated with an AI image tool (Midjourney, DALL-E,
Adobe Firefly, etc.) or sourced from a properly licensed stock photo site,
then saved as:

    client/public/hero-farmer-market.jpg

Once that file exists, the hero section in Home.jsx will pick it up
automatically — no code change needed. Delete this txt file once the real
image is in place.

Recommended size: at least 1920x1080px, landscape orientation, so it looks
sharp on large desktop screens without stretching.
