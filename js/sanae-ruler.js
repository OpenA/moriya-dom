/** Custom element like `<input type="range">` */
class SanaeRuler extends HTMLElement {

	constructor({
		label = 'size', width = 150, min = 0,
		type  = 'px', precision = 0, max = 100,
	}) {
	super();

		const sae_line   = _setup('sae-line', { 'data-label': label });
		const sae_value  = _setup('sae-value', { 'data-type': type, spellcheck: false, contentEditable: true });
		const sae_slider = _setup('sae-slider', { style: 'left: 0;' });

		let rls = [document.createElement('r-hl')],
		    pcn = 10 * precision, _t = -1;

		for(let i = 0, len = Math.round(width / 22); i < len; i++)
			rls.push(document.createElement('r-l'));

		rls.push(sae_line, sae_slider);

		super.append(...rls);
		super.style.width = `${width}px`;
		super.addEventListener(UIDragable.DOWN, this);

		sae_line.append(sae_value);
		sae_value.addEventListener('input', e => {
			/*...*/ clearTimeout(_t);
			_t = setTimeout(() => this.handleEvent(e), 800);
		});
		const setIntVal = { enumerable: true, configurable: true,
			get: () => parseInt(sae_value.textContent),
			set: i => (sae_value.textContent = Math.floor(i))
		};
		const setFpVal = { enumerable: true, configurable: true,
			get: () => parseFloat(sae_value.textContent),
			set: f => (sae_value.textContent = f.toFixed(precision))
		};
		Object.defineProperties(this, {
			min: { value: min, enumerable: true, writable: true },
			max: { value: max, enumerable: true, writable: true },
			value: pcn ? setFpVal : setIntVal,
			precision: {
				get: () => precision, enumerable: true,
				set: n => {
					pcn = 10 * (precision = n);
					Object.defineProperty(this, 'value', n ? setFpVal : setIntVal);
				}
			},
			dataLabel: {
				get: () => label, enumerable: true,
				set: s => { sae_line.setAttribute('data-label', s) }
			},
			dataType: {
				get: () => type, enumerable: true,
				set: s => { sae_value.setAttribute('data-type', s) }
			}
		});
	}

	handleEvent(e) {

		const isVal = e.target.tagName === 'SAE-VALUE',
		      point = isVal ? e.type === 'input' : UIDragable.getPoint(e);
		if ( !point )
			return;
		const { min, max } = this;
		const { left, width } = this.getBoundingClientRect();

		const slider  = this.lastElementChild;
		const marginX = slider.clientWidth,
		      maxLeft = width - marginX;

		if (isVal) {
			let v = this.value || 0, x;
			if (v < min) {
				v = min, x = 0;
			} else  if ( v > max ) {
				v = max, x = maxLeft;
			} else {
				x = maxLeft * ((v - min) / (max - min));
			}
			slider.style.left = `${x}px`, this.value = v;
			this.dispatchEvent(new InputEvent('change', { bubbles: true }));
			return;
		}
		const callback = e => {
			const o = UIDragable.getPoint(e);
			if ( !o ) return;
			let x = o.pointX - left - marginX, v;
			if (x < 0) {
				v = min, x = 0;
			} else  if ( x > maxLeft) {
				v = max, x = maxLeft;
			} else {
				v = (o.pointX - left) / width * max;
			}
			slider.style.left = `${x}px`, this.value = v;
			this.dispatchEvent(new InputEvent('change', { bubbles: true }));
		}
		e.preventDefault();
		e.stopPropagation();
		if (e.target !== slider)
			callback(e);
		UIDragable.live(slider, { callback });
	}
};
customElements.define('sae-ruler', SanaeRuler);
