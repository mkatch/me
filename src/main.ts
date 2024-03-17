import './style.css'

const headerBackgroundElement = document.getElementById('header-background')!;
const navElement = document.getElementsByTagName('nav')[0]!;
const navIndicatorElement = document.getElementById('nav-indicator')!;
const titleElement = document.getElementById('title')!;

const nameAnimation = [
	'|',
	'M|',
	'Ma|',
	'Mar|',
	'Marc|',
	'Marci|',
	'Marcin|',
	'Marcin |',
	'Marcin K|',
	'Marcin Ka|',
	'Marcin Kac|',
	'Marcin Kacz|',
	'Marcin Kaczm|',
	'Marcin Kaczma|',
	'Marcin Kaczmar|',
	'Marcin Kaczmare|',
	'Marcin Kaczmarek|',
	'Marcin Kaczmare|',
	'Marcin Kaczmar|',
	'Marcin Kaczma|',
	'Marcin Kaczm|',
	'Marcin Kacz|',
	'Marcin Kac|z',
	'Marcin Ka|cz',
	'Marcin K|acz',
	'Marcin |kacz',
	'Marcin|kacz',
	'Marci|kacz',
	'Marc|kacz',
	'Mar|kacz',
	'Ma|kacz',
	'M|kacz',
	'mkacz',
	// 'Marcin [|K]acz',
	// 'Marcin [|K]acz',
	// 'Marcin [|K]acz',
	// '[|Marcin K]acz',
	// '[|Marcin K]acz',
	// '[|Marcin K]acz',
	// 'm|acz',
	// 'mk|acz',
	// 'Marcin k|acz',
	// 'Marcin |kacz',
	// 'Marcin|kacz',
	// 'Marci|kacz',
	// 'Marc|kacz',
	// 'Mar|kacz',
	// 'Ma|kacz',
	// 'M|kacz',
	// '|>M<kacz',
	// 'm|kacz',
	// '|mkacz',
];

const revealAnimationLastFrameIndex = nameAnimation.indexOf('Marcin Kaczmarek|');
let nameAnimationFrameIndex = -1;
function setNameAnimationFrame(frameIndex: number) {
	if (nameAnimationFrameIndex === frameIndex) {
		return;
	}
	const gg = nameAnimation[frameIndex]
		.replace(/\[/, '<span class="select">')
		.replace(/\]/, '</span>')
		.replace(/\|(.)/, '<span class="cursor">$1</span>')
		.replace(/\|$/, '<span class="cursor">&nbsp;</span>');
	titleElement.innerHTML = gg;
	nameAnimationFrameIndex = frameIndex;
}

const revealAnimationTimer = setInterval(() => {
	if (nameAnimationFrameIndex >= revealAnimationLastFrameIndex) {
		clearInterval(revealAnimationTimer);
		return;
	}
	setNameAnimationFrame(nameAnimationFrameIndex + 1);
}, 60);

function onAnimationFrame() {
	const scrollTop = document.scrollingElement!.scrollTop;
	const tCollapse = Math.max(0, Math.min(1, scrollTop / (headerBackgroundElement.offsetHeight - navElement.offsetHeight)));
	document.body.style.setProperty('--scroll-top', CSS.px(scrollTop).toString());
	document.body.style.setProperty('--t-collapse', tCollapse.toString());

	const t = tCollapse;
	const i = Math.round(revealAnimationLastFrameIndex + t * (nameAnimation.length - 1 - revealAnimationLastFrameIndex));
	setNameAnimationFrame(i);

	window.requestAnimationFrame(onAnimationFrame);
};
window.requestAnimationFrame(onAnimationFrame);

navElement.addEventListener('click', e => {
	const target = e.target;
	if (!(target instanceof HTMLAnchorElement)) {
		return;
	}
	const r = target.getBoundingClientRect();
	navIndicatorElement.style.left = CSS.px(r.left).toString();
	navIndicatorElement.style.width = CSS.px(r.width).toString();
});