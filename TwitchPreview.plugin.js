/**
 * @name TwitchPreview
 * @author Snues
 * @description Adds inline video previews to Twitch links, similar to YouTube embeds
 * @version 1.0.0
 * @source https://github.com/Snusene/TwitchPreview
 */

module.exports = class TwitchPreview {
    constructor() {
        this.observer = null;
        this.styleEl = null;
    }

    start() {
        this.injectStyles();
        this.processEmbeds();
        this.observer = new MutationObserver(() => this.processEmbeds());
        this.observer.observe(document.body, { childList: true, subtree: true });
    }

    stop() {
        if (this.observer) this.observer.disconnect();
        if (this.styleEl) this.styleEl.remove();
        document.querySelectorAll(".twitch-video-preview").forEach(el => el.remove());
        document.querySelectorAll("[data-twitch-modified]").forEach(el => delete el.dataset.twitchModified);
        document.querySelectorAll("[data-twitch-processed]").forEach(el => delete el.dataset.twitchProcessed);
    }

    injectStyles() {
        this.styleEl = document.createElement("style");
        this.styleEl.id = "twitch-preview-styles";
        this.styleEl.textContent = `
            .twitch-video-preview {
                position: relative;
                width: 400px;
                height: 225px;
                border-radius: 8px;
                overflow: hidden;
                cursor: pointer;
                background: #000;
                margin: 4px 16px 12px 12px;
                grid-column: 1 / -1;
            }
            .twitch-video-preview img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .twitch-video-preview .play-btn {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 68px;
                height: 48px;
                background: rgba(145, 70, 255, 0.9);
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .twitch-video-preview:hover .play-btn { background: #9146ff; }
            .twitch-video-preview .live-badge {
                position: absolute;
                top: 10px;
                left: 10px;
                background: #eb0400;
                color: white;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
                font-weight: 600;
            }
            .twitch-video-preview iframe {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
            }
        `;
        document.head.appendChild(this.styleEl);
    }

    processEmbeds() {
        document.querySelectorAll('a[href*="twitch.tv/"]').forEach(link => {
            if (link.dataset.twitchProcessed) return;

            const match = link.href.match(/twitch\.tv\/(\w+)$/i);
            if (!match) return;

            const channel = match[1].toLowerCase();
            if (channel === "directory" || channel === "videos") return;

            link.dataset.twitchProcessed = "true";

            let embed = link.closest('[class*="embed"]');
            if (!embed) {
                embed = link.parentElement;
                while (embed && embed.parentElement) {
                    if (embed.querySelector('[class*="pill"]') || embed.children.length >= 2) break;
                    embed = embed.parentElement;
                    if (embed.tagName === "MAIN" || embed.tagName === "BODY") { embed = null; break; }
                }
            }

            if (!embed || embed.dataset.twitchModified) return;
            embed.dataset.twitchModified = "true";

            setTimeout(() => this.modifyEmbed(embed, channel), 150);
        });
    }

    modifyEmbed(embed, channel) {
        if (embed.querySelector(".twitch-video-preview")) return;

        let embedFull = embed.closest('[class*="embedFull"]');
        if (!embedFull) {
            let el = embed;
            for (let i = 0; i < 10 && el; i++) {
                if (el.className?.includes?.("embedFull")) { embedFull = el; break; }
                el = el.parentElement;
            }
        }

        if (!embedFull) return;

        embedFull.style.setProperty("border-left-color", "#9146ff", "important");
        embedFull.querySelectorAll('[class*="embedThumbnail"]').forEach(el => el.style.display = "none");
        embedFull.querySelectorAll('[class*="embedDescription"]').forEach(el => el.style.display = "none");

        const grid = embedFull.querySelector('[class*="grid"]');
        if (grid) {
            grid.style.setProperty("grid-template-columns", "1fr", "important");
            grid.appendChild(this.createVideoPreview(channel));
        }
    }

    createVideoPreview(channel) {
        const container = document.createElement("div");
        container.className = "twitch-video-preview";

        const thumb = document.createElement("img");
        thumb.src = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-640x360.jpg`;
        thumb.onerror = () => thumb.src = "https://static-cdn.jtvnw.net/ttv-static/404_preview-640x360.jpg";

        const playBtn = document.createElement("div");
        playBtn.className = "play-btn";
        playBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>';

        const liveBadge = document.createElement("div");
        liveBadge.className = "live-badge";
        liveBadge.textContent = "LIVE";

        container.append(thumb, playBtn, liveBadge);
        container.onclick = () => this.playStream(container, channel);

        return container;
    }

    playStream(container, channel) {
        const iframe = document.createElement("iframe");
        iframe.src = `https://player.twitch.tv/?channel=${channel}&parent=discord.com&autoplay=true`;
        iframe.allow = "autoplay; fullscreen";
        iframe.allowFullscreen = true;
        container.innerHTML = "";
        container.style.cursor = "default";
        container.appendChild(iframe);
    }
};
