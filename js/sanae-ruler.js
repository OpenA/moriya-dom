
class SanaeRuler {

	constructor({
		label = 'size', min = 0, step = 1, max = 100, width = 150
	}) {
		const sae_ruler  = _setup('div', { class: 'sae-ruler', style: `width: ${width}px;` });
		const sae_params = _setup('div', { class: 'sae-params', label, min, step, max });
		const sae_value  = _setup('code', { class: 'sae-value', contentEditable: true });
		const sae_slider = _setup('span', { class: 'sae-slider', style: 'left: 0;' });

		let rls = [document.createElement('rhl')],
		    isInt = Number.isInteger(step), _t = -1;

		for (let i = 0, len = Math.round(width / 22); i < len; i++)
			rls.push(document.createElement('rl'));

		rls.push(sae_params, sae_slider);
		sae_ruler.addEventListener(UIDragable.DOWN, this);
		sae_value.addEventListener('input', e => {
			/*...*/ clearTimeout(_t);
			_t = setTimeout(() => this.handleEvent(e), 500);
		});
		sae_ruler.append(...rls);
		sae_params.append(sae_value);

		const value = isInt ? {
			get: () => parseInt(sae_value.textContent), enumerable: true,
			set: i => (sae_value.textContent = Math.floor(i))
		} : {
			get: () => parseFloat(sae_value.textContent), enumerable: true,
			set: f => (sae_value.textContent = Math.floor(f * 10) / 10)
		};
		Object.defineProperties(this, {
			saeNodeRuler: { value: sae_ruler, enumerable: true },
			value,
			MIN  : { value: min, enumerable: true },
			STEP : { value: step, enumerable: true },
			MAX  : { value: max, enumerable: true }
		});
	}

	handleEvent(e) {

		const isVal = e.target.classList[0] === 'sae-value',
		      point = isVal ? e.type === 'input' : UIDragable.getPoint(e);
		if ( !point )
			return;
		const { saeNodeRange, MIN, MAX } = this;
		const { left, width } = saeNodeRange.getBoundingClientRect();

		const slider  = saeNodeRange.lastElementChild;
		const marginX = slider.clientWidth,
		      maxLeft = width - marginX;

		if (isVal) {
			let v = this.value || 0, x;
			if (v < MIN) {
				v = MIN, x = 0;
			} else  if ( v > MAX ) {
				v = MAX, x = maxLeft;
			} else {
				x = maxLeft * ((v - MIN) / (MAX - MIN));
			}
			slider.style.left = `${x}px`, this.value = v;
			saeNodeRange.dispatchEvent(new Event('change', { bubbles: true }));
			return;
		}
		const callback = e => {
			const o = UIDragable.getPoint(e);
			if ( !o ) return;
			let x = o.pointX - left - marginX, v;
			if (x < 0) {
				v = MIN, x = 0;
			} else  if ( x > maxLeft) {
				v = MAX, x = maxLeft;
			} else {
				v = (o.pointX - left) / width * MAX;
			}
			slider.style.left = `${x}px`, this.value = v;
			saeNodeRange.dispatchEvent(new Event('change', { bubbles: true }));
		}
		e.preventDefault();
		e.stopPropagation();
		if (e.target !== slider)
			callback(e);
		UIDragable.live(slider, { callback });
	}
}
