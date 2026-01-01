/**
 * @name TwitchPreview
 * @author Snues
 * @description Adds inline video previews to Twitch links, similar to YouTube embeds
 * @version 2.0.0
 * @source https://github.com/Snusene/TwitchPreview
 */

module.exports = class TwitchPreview {
    start() {
        BdApi.DOM.addStyle("TwitchPreview", this.css);

        this.embedClasses = BdApi.Webpack.getByKeys("embedVideo", "embedVideoActions");
        this.iconClasses = BdApi.Webpack.getByKeys("iconWrapper", "iconWrapperActive");
        this.anchorClasses = BdApi.Webpack.getByKeys("anchor", "anchorUnderlineOnHover");

        this.observer = new MutationObserver(() => this.processEmbeds());
        this.observer.observe(document.body, { childList: true, subtree: true });
        setTimeout(() => this.processEmbeds(), 500);
    }

    stop() {
        BdApi.DOM.removeStyle("TwitchPreview");
        this.observer.disconnect();
        document.querySelectorAll('[data-twitch-processed]').forEach(el => el.removeAttribute('data-twitch-processed'));
        document.querySelectorAll('[data-twitch-hidden]').forEach(el => el.removeAttribute('data-twitch-hidden'));
        document.querySelectorAll('.twitch-preview-container, .twitch-combined-title').forEach(el => el.remove());
    }

    get css() {
        return `
            [data-twitch-processed] [class*="embedTitle"],
            [data-twitch-processed] [class*="embedAuthor"],
            [data-twitch-processed] [class*="embedDescription"],
            [data-twitch-processed] [class*="embedThumbnail"] { display: none !important; }
            [data-twitch-hidden] { display: none !important; }
            [data-twitch-processed] [class*="grid"] { display: flex !important; flex-direction: column !important; }
            [data-twitch-processed] { max-width: 432px !important; border-left-color: #9146ff !important; }
            [data-twitch-processed] .twitch-combined-title { display: block !important; width: 100% !important; color: var(--text-link) !important; font-size: 16px !important; font-weight: 600 !important; margin-top: 8px !important; max-width: 400px !important; line-height: 1.25 !important; cursor: pointer !important; text-align: left !important; }
            [data-twitch-processed] .twitch-combined-title:hover { text-decoration: underline !important; }
            .twitch-preview-container { margin-top: 4px; padding: 0 8px 16px 12px; }
            .twitch-video-wrapper { position: relative; width: 400px; height: 225px; border-radius: 4px; overflow: hidden; background: #18181b; }
            .twitch-video-wrapper img { width: 100%; height: 100%; object-fit: cover; }
            .twitch-video-wrapper .twitch-live-badge { position: absolute; top: 10px; left: 10px; background: #eb0400; color: white; padding: 2px 6px; border-radius: 3px; font-size: 12px; font-weight: 600; }
            .twitch-video-wrapper iframe { width: 100%; height: 100%; border: none; }
        `;
    }

    createControls(channel, wrapper) {
        const actions = document.createElement('div');
        actions.className = this.embedClasses.embedVideoActions;

        const centerContent = document.createElement('div');
        centerContent.className = this.embedClasses.centerContent;

        const btnWrapper = document.createElement('div');
        btnWrapper.className = this.iconClasses.wrapper;

        const playBtn = document.createElement('div');
        playBtn.className = `${this.iconClasses.iconWrapperActive} ${this.iconClasses.iconWrapper}`;
        playBtn.tabIndex = 0;
        playBtn.setAttribute('aria-label', 'Play');
        playBtn.setAttribute('role', 'button');
        playBtn.innerHTML = `<svg class="${this.iconClasses.iconPlay} ${this.iconClasses.icon}" aria-hidden="true" role="img" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24"><path fill="currentColor" d="M9.25 3.35C7.87 2.45 6 3.38 6 4.96v14.08c0 1.58 1.87 2.5 3.25 1.61l10.85-7.04a1.9 1.9 0 0 0 0-3.22L9.25 3.35Z"></path></svg>`;
        playBtn.onclick = (e) => {
            e.stopPropagation();
            e.preventDefault();
            wrapper.innerHTML = `<iframe src="https://player.twitch.tv/?channel=${channel}&parent=discord.com&autoplay=true" allow="autoplay; fullscreen" allowfullscreen></iframe>`;
        };

        const openBtn = document.createElement('a');
        openBtn.className = `${this.anchorClasses.anchor} ${this.anchorClasses.anchorUnderlineOnHover} ${this.iconClasses.iconWrapperActive} ${this.iconClasses.iconWrapper}`;
        openBtn.href = `https://twitch.tv/${channel}`;
        openBtn.target = '_blank';
        openBtn.rel = 'noreferrer noopener';
        openBtn.tabIndex = 0;
        openBtn.setAttribute('role', 'button');
        openBtn.innerHTML = `<svg aria-label="Open Link" class="${this.iconClasses.iconExternalMargins} ${this.iconClasses.icon}" aria-hidden="false" role="img" width="16" height="16" viewBox="0 0 24 24"><path fill="currentColor" transform="translate(3.000000, 4.000000)" d="M16 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4v-2H2V4h14v10h-4v2h4c1.1 0 2-.9 2-2V2a2 2 0 0 0-2-2zM9 6l-4 4h3v6h2v-6h3L9 6z"></path></svg>`;
        openBtn.onclick = (e) => e.stopPropagation();

        btnWrapper.append(playBtn, openBtn);
        centerContent.appendChild(btnWrapper);
        actions.appendChild(centerContent);
        return actions;
    }

    processEmbeds() {
        document.querySelectorAll('article[class*="embed"]').forEach(embed => {
            if (embed.hasAttribute('data-twitch-processed')) return;

            const link = embed.querySelector('a[href*="twitch.tv/"]');
            if (!link) return;
            if (/twitch\.tv\/\w+\/(clip|video|videos|clips)/i.test(link.href)) return;

            const match = link.href.match(/twitch\.tv\/([a-zA-Z0-9_]+)\/?$/i);
            if (!match) return;

            const channel = match[1].toLowerCase();
            if (['directory', 'videos', 'settings', 'downloads', 'search'].includes(channel)) return;

            embed.setAttribute('data-twitch-processed', 'true');

            const existingMedia = embed.querySelector('[class*="embedVideo"], [class*="embedImage"], [class*="embedThumbnail"]');
            if (existingMedia) existingMedia.setAttribute('data-twitch-hidden', 'true');

            const description = embed.querySelector('[class*="embedDescription"]');
            const authorName = embed.querySelector('[class*="embedAuthorName"]');
            const streamTitle = description?.textContent?.trim();
            const displayName = authorName?.textContent?.trim() || channel;

            const provider = embed.querySelector('[class*="embedProvider"]');
            if (provider) {
                const combinedTitle = document.createElement('div');
                combinedTitle.className = 'twitch-combined-title';
                combinedTitle.textContent = streamTitle ? `${displayName} - ${streamTitle}` : displayName;
                combinedTitle.onclick = () => window.open(`https://twitch.tv/${channel}`, '_blank');
                provider.parentElement.appendChild(combinedTitle);
            }

            const container = document.createElement('div');
            container.className = 'twitch-preview-container';

            const wrapper = document.createElement('div');
            wrapper.className = 'twitch-video-wrapper';

            const img = document.createElement('img');

            const badge = document.createElement('div');
            badge.className = 'twitch-live-badge';
            badge.textContent = 'LIVE';
            badge.style.display = 'none';

            const timestamp = Date.now();
            this.getChannelInfo(channel).then(info => {
                if (info.isLive) {
                    badge.style.display = 'block';
                    img.src = `https://static-cdn.jtvnw.net/previews-ttv/live_user_${channel}-640x360.jpg?t=${timestamp}`;
                } else if (info.offlineImage) {
                    img.src = info.offlineImage;
                } else if (info.bannerImage) {
                    img.src = info.bannerImage;
                } else if (info.profileImage) {
                    img.src = info.profileImage;
                }
            });

            wrapper.append(img, this.createControls(channel, wrapper), badge);
            container.appendChild(wrapper);

            const grid = embed.querySelector('[class*="grid"]');
            if (grid) grid.appendChild(container);
        });
    }

    async getChannelInfo(channel) {
        try {
            const response = await fetch('https://gql.twitch.tv/gql', {
                method: 'POST',
                headers: { 'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko', 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: `query { user(login: "${channel}") { stream { id } offlineImageURL bannerImageURL profileImageURL(width: 600) } }`
                })
            });
            const data = await response.json();
            const user = data?.data?.user;
            return {
                isLive: !!user?.stream,
                offlineImage: user?.offlineImageURL,
                bannerImage: user?.bannerImageURL,
                profileImage: user?.profileImageURL
            };
        } catch {
            return { isLive: false };
        }
    }
};
